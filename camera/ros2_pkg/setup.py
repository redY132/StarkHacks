from setuptools import setup

package_name = 'panko_camera'

setup(
    name=package_name,
    version='1.0.0',
    packages=[package_name],
    install_requires=['setuptools'],
    entry_points={
        'console_scripts': [
            'face_recognition_node = panko_camera.face_recognition_node:main',
            'stream_receiver = panko_camera.stream_receiver:main',
        ],
    },
)
