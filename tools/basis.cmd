@echo off

set curpath=%cd%
set curdrive=%curpath:~0,2%
if exist "%curpath%\server.config" goto :found
:dir_loop
for %%j in ("%curpath%") DO set curpath=%%~dpj
set curpath=%curpath:~0,-1%
if exist "%curpath%\server.config" goto :found
if /i "%curpath%"=="%curdrive%" goto :notfound
goto dir_loop
:found

cd %0\..

set command=%1

rem throw the first parameter away
shift
set params=%1
:loop
shift
if [%1]==[] goto afterloop
set params=%params% %1
goto loop
:afterloop

if "%command%"=="server" node server\server.js %curpath% %params%
if "%command%"=="rebuild" node build.js %params%
if "%command%"=="build" node build\build.js --base %curpath% %params%
if "%command%"=="tmplcheck" node template\check.js %curpath% %params%
:notfound