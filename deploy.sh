#!/bin/bash
set -e

echo "🚀 Building Next.js Standalone..."
npm run build

echo "📦 Syncing build to Hostinger..."
rsync -avz -e "ssh -p 65002 -i ~/.ssh/id_ed25519" .next/standalone/ u708773678@147.93.80.82:~/domains/koperasiilantatjaya.com/hbuilds/silsilah/nodejs/
rsync -avz -e "ssh -p 65002 -i ~/.ssh/id_ed25519" .next/static/ u708773678@147.93.80.82:~/domains/koperasiilantatjaya.com/hbuilds/silsilah/nodejs/.next/static/
rsync -avz -e "ssh -p 65002 -i ~/.ssh/id_ed25519" public/ u708773678@147.93.80.82:~/domains/koperasiilantatjaya.com/hbuilds/silsilah/nodejs/public/

echo "🔄 Restarting Passenger Node.js..."
ssh -p 65002 -i ~/.ssh/id_ed25519 u708773678@147.93.80.82 "touch ~/domains/koperasiilantatjaya.com/hbuilds/silsilah/nodejs/tmp/restart.txt"

echo "✅ Deployment finished successfully!"
