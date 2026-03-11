#!/bin/bash

# CAC Document Permissions Fix
# This script deploys the updated Firebase Storage rules to fix the 403 Forbidden errors

echo "🔧 Deploying Firebase Storage rules to fix CAC document permissions..."

# Deploy storage rules
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Wait 1-2 minutes for the rules to propagate"
    echo "2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
    echo "3. Try accessing CAC documents again"
    echo ""
    echo "🔍 What was fixed:"
    echo "- Simplified storage rules to allow authenticated users to access CAC documents"
    echo "- Removed complex Firestore queries that were causing permission failures"
    echo "- Access control is now enforced at the application level for better reliability"
else
    echo "❌ Failed to deploy storage rules"
    echo "Please check your Firebase CLI setup and try again"
    exit 1
fi