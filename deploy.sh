#!/bin/bash

zip -r whatHappenedToday.zip . -x "dataSample/*" ".git/*"
aws lambda update-function-code --function-name WhatHappenedToday --zip-file fileb://whatHappenedToday.zip
