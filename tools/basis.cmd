@echo off
set curpath=%cd%
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
if "%command%"=="build" node build\build.js %curpath% %params%
if "%command%"=="tmplcheck" node template\check.js %curpath% %params%