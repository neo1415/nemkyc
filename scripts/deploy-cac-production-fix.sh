#!/bin/bash

echo "Deploying CAC Production Fix..."
echo

echo "Building the application..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "Deployment failed!"
    exit 1
fi

echo
echo "✅ CAC Production Fix deployed successfully!"
echo
echo "Next steps:"
echo "1. Test the decryption endpoint using the test script in browser console"
echo "2. Try previewing CAC documents in production"
echo "3. Monitor browser console for any remaining errors"
echo