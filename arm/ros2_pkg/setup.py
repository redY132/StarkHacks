from setuptools import setup

package_name = 'panko_arm'

setup(
    name=package_name,
    version='1.0.0',
    packages=[package_name],
    install_requires=['setuptools'],
    entry_points={
        'console_scripts': [
            'arm_control_node = panko_arm.arm_control_node:main',
            'shelf_vision = panko_arm.shelf_vision:main',
        ],
    },
)
