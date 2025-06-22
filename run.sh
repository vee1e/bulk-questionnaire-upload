#!/bin/bash

PROJECT_ROOT=$(pwd)
FRONTEND_PATH="$PROJECT_ROOT/frontend"
BACKEND_PATH="$PROJECT_ROOT/backend"
SESSION_NAME="dev-project"

if ! tmux has-session -t "$SESSION_NAME"; then
    tmux new-session -s "$SESSION_NAME" -d
    tmux split-window -v -t "$SESSION_NAME:0.0"

    # --- Top Pane (Frontend) ---
    tmux send-keys -t "$SESSION_NAME:0.0" "cd $FRONTEND_PATH" C-m
    tmux send-keys -t "$SESSION_NAME:0.0" "ng serve" C-m

    # --- Bottom Pane (Backend) ---
    tmux send-keys -t "$SESSION_NAME:0.0" "select-pane -t 1" C-m
    tmux send-keys -t "$SESSION_NAME:0.1" "cd $BACKEND_PATH" C-m
    tmux send-keys -t "$SESSION_NAME:0.1" "source .venv/bin/activate" C-m
    tmux send-keys -t "$SESSION_NAME:0.1" "uvicorn main:app --reload" C-m

    tmux attach-session -t "$SESSION_NAME"
else
    echo "Tmux session '$SESSION_NAME' already exists. Attaching..."
    tmux attach-session -t "$SESSION_NAME"
fi

