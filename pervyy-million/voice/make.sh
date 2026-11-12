#!/bin/sh
# Re-synthesize the voiceover with RHVoice (apt install rhvoice rhvoice-russian).
cd "$(dirname "$0")"
while IFS="$(printf '\t')" read id v r p txt; do echo "$txt" | RHVoice-test -p "$v" -r "$r" -t "$p" -o "$id.wav"; done < lines.tsv
