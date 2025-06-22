#!/bin/bash

# Define your project root (where this script is located)
PROJECT_ROOT=$(pwd)

# Define the paths relative to the project root
FRONTEND_PATH="$PROJECT_ROOT/frontend"
BACKEND_PATH="$PROJECT_ROOT/backend"

# Name of your tmux session
SESSION_NAME="dev-project"

# Check if the tmux session already exists
tmux has-session -t "$SESSION_NAME" 2>/dev/null

if [ $? != 0 ]; then
  echo "Creating new tmux session: $SESSION_NAME"
  # Create a new tmux session and window
  tmux new-session -s "$SESSION_NAME" -d

  # Split the window into two panes
  tmux split-window -v -t "$SESSION_NAME:0.0" # Splits the first pane vertically

  # --- Top Pane (Frontend) ---
  echo "Setting up top pane (frontend)..."
  tmux send-keys -t "$SESSION_NAME:0.0" "cd $FRONTEND_PATH" C-m
  tmux send-keys -t "$SESSION_NAME:0.0" "echo 'Starting Angular development server...'" C-m
  tmux send-keys -t "$SESSION_NAME:0.0" "ng serve" C-m

  # --- Bottom Pane (Backend) ---
  echo "Setting up bottom pane (backend)..."
  tmux send-keys -t "$SESSION_NAME:0.0" "select-pane -t 1" C-m # Select the bottom pane
  tmux send-keys -t "$SESSION_NAME:0.1" "cd $BACKEND_PATH" C-m
  tmux send-keys -t "$SESSION_NAME:0.1" "echo 'Activating Python virtual environment...'" C-m
  tmux send-keys -t "$SESSION_NAME:0.1" "source .venv/bin/activate" C-m
  tmux send-keys -t "$SESSION_NAME:0.1" "echo 'Starting FastAPI development server...'" C-m
  tmux send-keys -t "$SESSION_NAME:0.1" "uvicorn main:app --reload" C-m

  echo "Tmux session '$SESSION_NAME' created. Attaching..."
  tmux attach-session -t "$SESSION_NAME"
else
  echo "Tmux session '$SESSION_NAME' already exists. Attaching..."
  tmux attach-session -t "$SESSION_NAME"
fi
