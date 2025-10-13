"""
Setup script for Local Leads Finder.
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="leads-finder",
    version="1.0.1",
    description="Local business leads finder using Decodo proxies",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Yousef Kotp",
    author_email="yousefkotp@outlook.com",
    url="https://github.com/yousefkotp/local-leads-finder",
    project_urls={
        "Documentation": "https://github.com/yousefkotp/local-leads-finder#readme",
        "Source": "https://github.com/yousefkotp/local-leads-finder",
        "Issue Tracker": "https://github.com/yousefkotp/local-leads-finder/issues",
        "Releases": "https://github.com/yousefkotp/local-leads-finder/releases",
        "PyPI": "https://pypi.org/project/leads-finder/",
    },
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
        "beautifulsoup4>=4.12.0",
        "lxml>=4.9.0",
        "python-Levenshtein>=0.21.0",
        "python-dotenv>=1.0.0",
        "click>=8.1.0",
    ],
    entry_points={
        "console_scripts": [
            "leads-finder=leads_finder.core.cli:main",
        ],
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
