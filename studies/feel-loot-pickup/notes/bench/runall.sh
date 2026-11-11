#!/bin/sh
# Rerun every condition. Takes several minutes. Run from anywhere.
cd "$(dirname "$0")"
PY=../../../../.venv/bin/python
$PY run.py metal frames=200 > log-metal.txt 2>&1
$PY run.py metal throttle6 frames=100 > log-metal-throttle6.txt 2>&1
$PY run.py swiftshader frames=100 > log-swiftshader.txt 2>&1
$PY summarize.py > summary-table.md
