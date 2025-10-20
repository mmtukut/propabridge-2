#!/bin/bash

echo "🔍 Verifying Propabridge Frontend Setup..."
echo ""

# Check if files exist
echo "📁 Checking files..."
FILES=("frontend/styles.css" "frontend/api.js" "frontend/app.js" "frontend/chat.js" "frontend/index.html")
ALL_EXIST=true

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file" | tr -d ' ')
        echo "  ✅ $file (${size} bytes)"
    else
        echo "  ❌ $file NOT FOUND"
        ALL_EXIST=false
    fi
done

echo ""

# Check if HTML links to CSS/JS
echo "🔗 Checking HTML links..."
if grep -q 'href="styles.css"' frontend/index.html; then
    echo "  ✅ styles.css is linked"
else
    echo "  ❌ styles.css NOT linked"
fi

if grep -q 'src="api.js"' frontend/index.html; then
    echo "  ✅ api.js is linked"
else
    echo "  ❌ api.js NOT linked"
fi

if grep -q 'src="app.js"' frontend/index.html; then
    echo "  ✅ app.js is linked"
else
    echo "  ❌ app.js NOT linked"
fi

if grep -q 'src="chat.js"' frontend/index.html; then
    echo "  ✅ chat.js is linked"
else
    echo "  ❌ chat.js NOT linked"
fi

echo ""

# Check if backend is running
echo "🚀 Checking backend..."
if curl -s http://localhost:5000/api/v1/properties/search > /dev/null 2>&1; then
    echo "  ✅ Backend is running on port 5000"
else
    echo "  ⚠️  Backend not accessible (may need to start: cd backend && npm run dev)"
fi

echo ""

# Check if functions are exported
echo "📦 Checking JavaScript exports..."
if grep -q 'window.showScreen' frontend/app.js; then
    echo "  ✅ showScreen exported"
fi

if grep -q 'window.findProperties' frontend/app.js; then
    echo "  ✅ findProperties exported"
fi

if grep -q 'window.sendMessage' frontend/chat.js; then
    echo "  ✅ sendMessage exported"
fi

if grep -q 'window.API' frontend/api.js; then
    echo "  ✅ API object exported"
fi

echo ""
echo "✨ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start backend: cd backend && npm run dev"
echo "  2. Open http://localhost:5000 in your browser"
echo "  3. Test all functionality"
echo "  4. Check browser console for errors (F12)"
echo ""

