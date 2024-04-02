@echo off
REM If a command fails then the deploy stops
setlocal enabledelayedexpansion

echo Deploying updates to GitHub...

REM Build the project.
hugo -t paper

REM Go To Public folder
cd public

REM Add changes to git.
git add .

REM Commit changes.
set msg=rebuilding site %date%
if not "%~1"=="" set msg=%*

git commit -m "!msg!"

REM Push source and build repos.
git push origin main

cd ..

REM Update anyblogname
git add .
set msg=rebuilding site %date%
if not "%~1"=="" set msg=%*

git commit -m "!msg!"
