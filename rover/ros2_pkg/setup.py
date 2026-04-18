from setuptools import setup

package_name = 'panko_rover'

setup(
    name=package_name,
    version='1.0.0',
    packages=[package_name],
    install_requires=['setuptools'],
    entry_points={
        'console_scripts': [
            'state_machine = panko_rover.state_machine:main',
            'navigation_node = panko_rover.navigation_node:main',
            'app_bridge = panko_rover.app_bridge_node:main',
            'esp32_bridge = panko_rover.esp32_bridge_node:main',
        ],
    },
)
