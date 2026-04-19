idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES nvs_flash esp_wifi esp_event esp_driver_uart esp_driver_gpio esp_driver_ledc espressif__esp_websocket_client
)
