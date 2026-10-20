package types

type Player struct {
	Name      string
	Team      string
	CreatedAt int64
}

type Token struct {
	Value string `json:"value"`
}

type Claims struct {
	Player   Player
	IssuedAt int64
}
