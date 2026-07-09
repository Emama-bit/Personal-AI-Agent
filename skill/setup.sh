#!/bin/bash
# Personal AI Agent - Setup Script

AGENT_DIR="$HOME/personal-agent"

echo "🤖 Setting up Personal AI Agent..."

# Check if already installed
if [ -d "$AGENT_DIR" ]; then
  echo "✅ Agent already installed at $AGENT_DIR"
  cd "$AGENT_DIR" && git pull origin master
else
  echo "📥 Cloning repository..."
  git clone https://github.com/Emama-bit/Personal-AI-Agent.git "$AGENT_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "$AGENT_DIR/agent" && npm install

# Create .env if not exists
if [ ! -f "$AGENT_DIR/agent/.env" ]; then
  echo "⚙️  Creating configuration file..."
  cat > "$AGENT_DIR/agent/.env" << 'EOF'
# API Configuration (OpenAI-compatible format)
API_KEY=your-api-key-here
BASE_URL=https://your-proxy-url/v1
MODEL=your-model-name

# Data directories
DATA_DIR=../data
MEMORY_DIR=./memory
EOF
  echo "📝 Please edit $AGENT_DIR/agent/.env with your API configuration"
fi

# Create memory directory
mkdir -p "$AGENT_DIR/agent/memory"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit $AGENT_DIR/agent/.env with your API key"
echo "2. Start using the agent by saying 'remember that...' or 'record event...'"
echo ""
