@echo off
set curpath=%cd%
cd %0\..
If "%1"=="server" node server\server.js %curpath% %2 
If "%1"=="rebuild" node build.js %2 %3