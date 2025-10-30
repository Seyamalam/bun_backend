package utils

import (
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// IsValidEmail checks if an email is valid
func IsValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// IsValidPassword checks if a password meets requirements
func IsValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	var hasUpper, hasLower, hasNumber bool
	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		}
		if unicode.IsLower(char) {
			hasLower = true
		}
		if unicode.IsNumber(char) {
			hasNumber = true
		}
	}

	return hasUpper && hasLower && hasNumber
}

// ValidatePagination validates and returns pagination parameters
func ValidatePagination(pageStr, limitStr string) (page, limit, offset int) {
	page = 1
	limit = 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset = (page - 1) * limit
	return
}

// SanitizeSearchQuery sanitizes a search query
func SanitizeSearchQuery(query string) string {
	query = strings.TrimSpace(query)
	if len(query) > 100 {
		query = query[:100]
	}
	return query
}
