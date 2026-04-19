#include <string.h>
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "driver/uart.h"
#include "driver/ledc.h"
#include "esp_websocket_client.h"

#define TAG "lidar"

// TF-Luna frame constants
#define FRAME_HEADER    0x59
#define FRAME_LEN       9
#define TFLUNA_BAUD     115200
#define TFLUNA_BUF     (FRAME_LEN * 32)

#define STEPS           CONFIG_SCAN_SAMPLES

// LEDC servo: 50 Hz, 14-bit resolution → 1 count ≈ 1.22 µs
#define LEDC_MODE       LEDC_LOW_SPEED_MODE
#define LEDC_TIMER      LEDC_TIMER_0
#define LEDC_CHANNEL    LEDC_CHANNEL_0
#define LEDC_RES        LEDC_TIMER_14_BIT
#define LEDC_FREQ_HZ    50
#define US_TO_DUTY(us)  ((uint32_t)(us) * 16384 / 20000)

static EventGroupHandle_t s_wifi_eg;
#define WIFI_CONNECTED  BIT0

static esp_websocket_client_handle_t s_ws;
static uint16_t s_scan[STEPS];

// ── WiFi ─────────────────────────────────────────────────────────────────────

static void on_wifi_event(void *arg, esp_event_base_t base, int32_t id, void *data)
{
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED)
        esp_wifi_connect();
    else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP)
        xEventGroupSetBits(s_wifi_eg, WIFI_CONNECTED);
}

static void wifi_init(void)
{
    s_wifi_eg = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, on_wifi_event, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, on_wifi_event, NULL));

    wifi_config_t wcfg = { .sta = { .ssid = CONFIG_WIFI_SSID, .password = CONFIG_WIFI_PASSWORD } };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wcfg));
    ESP_ERROR_CHECK(esp_wifi_start());
    esp_wifi_connect();

    xEventGroupWaitBits(s_wifi_eg, WIFI_CONNECTED, false, true, portMAX_DELAY);
    ESP_LOGI(TAG, "WiFi connected");
}

// ── TF-Luna ──────────────────────────────────────────────────────────────────

static void tfluna_init(void)
{
    uart_config_t cfg = {
        .baud_rate  = TFLUNA_BAUD,
        .data_bits  = UART_DATA_8_BITS,
        .parity     = UART_PARITY_DISABLE,
        .stop_bits  = UART_STOP_BITS_1,
        .flow_ctrl  = UART_HW_FLOWCTRL_DISABLE,
    };
    ESP_ERROR_CHECK(uart_param_config(CONFIG_TFLUNA_UART_NUM, &cfg));
    ESP_ERROR_CHECK(uart_set_pin(CONFIG_TFLUNA_UART_NUM,
                                 CONFIG_TFLUNA_TX_PIN, CONFIG_TFLUNA_RX_PIN,
                                 UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_ERROR_CHECK(uart_driver_install(CONFIG_TFLUNA_UART_NUM, TFLUNA_BUF, 0, 0, NULL, 0));
}

// Returns distance in cm, or 0 for invalid/weak signal.
static uint16_t tfluna_read(void)
{
    for (int attempt = 0; attempt < 32; attempt++) {
        uint8_t b;
        if (uart_read_bytes(CONFIG_TFLUNA_UART_NUM, &b, 1, pdMS_TO_TICKS(20)) != 1) continue;
        if (b != FRAME_HEADER) continue;
        if (uart_read_bytes(CONFIG_TFLUNA_UART_NUM, &b, 1, pdMS_TO_TICKS(10)) != 1) continue;
        if (b != FRAME_HEADER) continue;

        uint8_t frame[FRAME_LEN];
        frame[0] = frame[1] = FRAME_HEADER;
        if (uart_read_bytes(CONFIG_TFLUNA_UART_NUM, &frame[2], 7, pdMS_TO_TICKS(20)) != 7) continue;

        uint8_t sum = 0;
        for (int i = 0; i < 8; i++) sum += frame[i];
        if (sum != frame[8]) continue;

        uint16_t dist     = frame[2] | (frame[3] << 8);
        uint16_t strength = frame[4] | (frame[5] << 8);

        if (strength < 100) return 0;
        return dist;
    }
    return 0;
}

// ── Servo (LEDC PWM) ─────────────────────────────────────────────────────────

static void servo_init(void)
{
    ledc_timer_config_t timer = {
        .speed_mode      = LEDC_MODE,
        .duty_resolution = LEDC_RES,
        .timer_num       = LEDC_TIMER,
        .freq_hz         = LEDC_FREQ_HZ,
        .clk_cfg         = LEDC_AUTO_CLK,
    };
    ESP_ERROR_CHECK(ledc_timer_config(&timer));

    ledc_channel_config_t ch = {
        .speed_mode = LEDC_MODE,
        .channel    = LEDC_CHANNEL,
        .timer_sel  = LEDC_TIMER,
        .intr_type  = LEDC_INTR_DISABLE,
        .gpio_num   = CONFIG_SERVO_PIN,
        .duty       = US_TO_DUTY(CONFIG_SERVO_STOP_US),
        .hpoint     = 0,
    };
    ESP_ERROR_CHECK(ledc_channel_config(&ch));
}

static void servo_set(uint32_t pulse_us)
{
    ledc_set_duty(LEDC_MODE, LEDC_CHANNEL, US_TO_DUTY(pulse_us));
    ledc_update_duty(LEDC_MODE, LEDC_CHANNEL);
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

static void publish_scan(void)
{
    if (!esp_websocket_client_is_connected(s_ws)) return;

    const int buf_size = 200 + STEPS * 7;
    char *buf = malloc(buf_size);
    if (!buf) return;

    int n = snprintf(buf, buf_size,
        "{\"type\":\"LIDAR_SCAN\",\"timestamp_ms\":%lu,"
        "\"angle_min_deg\":0,\"angle_max_deg\":%d,"
        "\"angle_increment_deg\":%d,\"ranges_cm\":[",
        (unsigned long)esp_log_timestamp(), STEPS - 1, 360 / STEPS);

    for (int i = 0; i < STEPS; i++) {
        n += snprintf(buf + n, buf_size - n, "%u", s_scan[i]);
        if (i < STEPS - 1) buf[n++] = ',';
    }
    n += snprintf(buf + n, buf_size - n, "]}");

    esp_websocket_client_send_text(s_ws, buf, n, portMAX_DELAY);
    free(buf);
}

// ── Scan task ─────────────────────────────────────────────────────────────────

static void scan_task(void *arg)
{
    const TickType_t interval = pdMS_TO_TICKS(CONFIG_SCAN_PERIOD_MS / STEPS);

    for (;;) {
        servo_set(CONFIG_SERVO_RUN_US);

        for (int i = 0; i < STEPS; i++) {
            vTaskDelay(interval);
            s_scan[i] = tfluna_read();
        }

        servo_set(CONFIG_SERVO_STOP_US);
        publish_scan();
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

void app_main(void)
{
    ESP_ERROR_CHECK(nvs_flash_init());

    wifi_init();
    tfluna_init();
    servo_init();

    esp_websocket_client_config_t ws_cfg = { .uri = CONFIG_WS_URI };
    s_ws = esp_websocket_client_init(&ws_cfg);
    esp_websocket_client_start(s_ws);

    xTaskCreate(scan_task, "scan_task", 4096, NULL, 5, NULL);
}
