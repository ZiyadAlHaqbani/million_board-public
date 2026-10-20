package handlers

import (
	"encoding/json"
	"io"
	"log"
	"million_board/auth"
	"net/http"
)

func HandleRegister(w http.ResponseWriter, r *http.Request) {

	respBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "couldn't read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()
	log.Printf("respBytes: %v", respBytes)

	var responseJson map[string]interface{}
	err = json.Unmarshal(respBytes, &responseJson)
	if err != nil {
		http.Error(w, "request json invalid", http.StatusBadRequest)
		return
	}

	newPlayerNameObject, exists := responseJson["Name"]
	if !exists {
		http.Error(w, "request body doesn't have field 'Name'", http.StatusBadRequest)
		return
	}
	newPlayerName, valid := newPlayerNameObject.(string)
	if !valid {
		http.Error(w, "'Name' isn't a string", http.StatusBadRequest)
		return
	}

	msg, err := auth.RegisterPlayer(newPlayerName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte(msg))
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	respBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "couldn't read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()
	log.Printf("respBytes: %v", respBytes)

	var requestJson map[string]interface{}
	err = json.Unmarshal(respBytes, &requestJson)
	if err != nil {
		http.Error(w, "request json invalid", http.StatusBadRequest)
		return
	}

	playerNameObject, exists := requestJson["Name"]
	if !exists {
		http.Error(w, "request body doesn't have field 'Name'", http.StatusBadRequest)
		return
	}
	playerName, valid := playerNameObject.(string)
	if !valid {
		http.Error(w, "'Name' isn't a string", http.StatusBadRequest)
		return
	}

	if playerName == "" {
		http.Error(w, "'Name' cannot be empty", http.StatusBadRequest)
		return
	}

	token, err := auth.LoginPlayer(playerName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	tokenJson, err := json.Marshal(token)
	if err != nil {
		http.Error(w, "failed to marshal token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(tokenJson)
}

func VerifyToken(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "missing 'Authorization' header", http.StatusBadRequest)
		return
	}

	player, err := auth.VerifyToken(authHeader)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	playerJson, err := json.Marshal(player)
	if err != nil {
		http.Error(w, "failed to marshal player", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(playerJson)
}
