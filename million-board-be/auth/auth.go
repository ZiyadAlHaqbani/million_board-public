package auth

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"million_board/types"
	"strings"
	"time"
)

var players = map[string]types.Player{}
var playerFlipFlop bool = false
var signingKey = "your-secret-key" // TODO: use environment variable

func RegisterPlayer(name string) (string, error) {
	_, exists := players[name]
	if exists {
		return "", fmt.Errorf("name %q is already in use", name)
	}

	team := map[bool]string{true: "red", false: "blue"}[playerFlipFlop]
	playerFlipFlop = !playerFlipFlop
	newPlayer := types.Player{
		Name:      name,
		Team:      team,
		CreatedAt: time.Now().UnixMilli(),
	}
	players[name] = newPlayer
	return fmt.Sprintf("player %q registered successfully as %s team", name, team), nil
}

func LoginPlayer(name string) (types.Token, error) {
	player, exists := players[name]
	if !exists {
		return types.Token{}, fmt.Errorf("player %q doesn't exist", name)
	}

	tokenString, err := signToken(player)
	if err != nil {
		return types.Token{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return types.Token{Value: tokenString}, nil
}

func signToken(player types.Player) (string, error) {
	issuedAt := time.Now().Unix()
	claims := types.Claims{
		Player:   player,
		IssuedAt: issuedAt,
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	claimsB64 := base64.StdEncoding.EncodeToString(claimsJSON)
	signature := hashSign(claimsB64 + "." + signingKey)

	return claimsB64 + "." + signature, nil
}

func VerifyToken(tokenString string) (types.Player, error) {
	// const tokenMaxAgeSecs = 86400 // 24 hours
	const tokenMaxAgeSecs = 30 // 30 seconds

	parts := strings.Split(tokenString, ".")
	if len(parts) != 2 {
		return types.Player{}, fmt.Errorf("invalid token format")
	}

	claimsB64 := parts[0]
	signature := parts[1]

	expectedSignature := hashSign(claimsB64 + "." + signingKey)
	if signature != expectedSignature {
		return types.Player{}, fmt.Errorf("invalid token signature")
	}

	claimsJSON, err := base64.StdEncoding.DecodeString(claimsB64)
	if err != nil {
		return types.Player{}, fmt.Errorf("failed to decode token")
	}

	var claims types.Claims
	err = json.Unmarshal(claimsJSON, &claims)
	if err != nil {
		return types.Player{}, fmt.Errorf("invalid token claims")
	}

	if time.Now().Unix()-claims.IssuedAt > tokenMaxAgeSecs {
		return types.Player{}, fmt.Errorf("token expired")
	}

	return claims.Player, nil
}

func hashSign(data string) string {
	hash := sha256.Sum256([]byte(data))
	return base64.StdEncoding.EncodeToString(hash[:])
}
