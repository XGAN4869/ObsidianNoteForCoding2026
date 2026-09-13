// utils/jwt.go
package utils

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

// 生产环境请放到配置/环境变量里
var jwtSecret = []byte("your-256-bit-secret-change-me")

const tokenExpire = 24 * time.Hour

type Claims struct {
    UserID uint64 `json:"uid"`
    Role   int8   `json:"role"`
    jwt.RegisteredClaims
}

// 签发 token
func GenerateToken(userID uint64, role int8) (string, error) {
    claims := Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenExpire)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "blog",
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// 解析 token
func ParseToken(tokenStr string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        // 防止算法被篡改
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return jwtSecret, nil
    })
    if err != nil {
        return nil, err
    }
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    return nil, errors.New("invalid token")
}