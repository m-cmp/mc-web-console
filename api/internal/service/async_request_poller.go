package service

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/internal/repository"
)

const (
	asyncPollInterval = 2 * time.Second
	asyncPollTTL      = 1 * time.Hour
)

// StartAsyncRequestPoller polls tumblebug GetRequest for Handling rows.
func StartAsyncRequestPoller(cfg *config.Config) {
	if repository.GetDB() == nil || cfg == nil {
		return
	}
	go func() {
		ticker := time.NewTicker(asyncPollInterval)
		defer ticker.Stop()
		log.Println("async request poller started")
		for range ticker.C {
			pollOnce(cfg)
		}
	}()
}

func pollOnce(cfg *config.Config) {
	db := repository.GetDB()
	if db == nil {
		return
	}
	repo := repository.NewAsyncRequestRepository(db)
	since := time.Now().UTC().Add(-asyncPollTTL)
	rows, err := repo.ListHandling(since)
	if err != nil {
		log.Printf("async poller list error: %v", err)
		return
	}
	for i := range rows {
		row := &rows[i]
		status, message, ok := fetchGetRequestStatus(cfg, row.RequestID)
		if !ok {
			// missing request past half TTL → Timeout
			if time.Since(row.StartedAt) > asyncPollTTL/2 {
				_ = repo.UpdateStatus(row.RequestID, model.AsyncStatusTimeout, "status check timed out")
			}
			continue
		}
		mapped, msg := mapTBStatus(status, message, row.Label)
		if mapped == model.AsyncStatusHandling {
			if msg != "" && msg != row.Message {
				_ = repo.UpdateStatus(row.RequestID, model.AsyncStatusHandling, msg)
			}
			continue
		}
		_ = repo.UpdateStatus(row.RequestID, mapped, msg)
	}
}

func mapTBStatus(status, errMsg, label string) (string, string) {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "success":
		msg := label + " — completed"
		if label == "" {
			msg = "completed"
		}
		return model.AsyncStatusSuccess, msg
	case "error":
		msg := errMsg
		if msg == "" {
			msg = "failed"
		}
		if label != "" {
			msg = label + " — " + msg
		}
		return model.AsyncStatusError, msg
	default:
		return model.AsyncStatusHandling, errMsg
	}
}

func fetchGetRequestStatus(cfg *config.Config, requestID string) (status, message string, ok bool) {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-infra-manager", "GetRequest")
	if err != nil || service == nil || actionSpec == nil {
		return "", "", false
	}
	baseURL := service.BaseURL
	if cfg.RegistryCache != nil && cfg.MCIAM.UseRegistryURL {
		if u := cfg.RegistryCache.GetBaseURL("mc-infra-manager", "GetRequest"); u != "" {
			baseURL = u
		}
	}
	path := strings.ReplaceAll(actionSpec.ResourcePath, "{reqId}", requestID)
	targetURL := baseURL + path

	req, err := http.NewRequest(strings.ToUpper(actionSpec.Method), targetURL, nil)
	if err != nil {
		return "", "", false
	}
	req.Header.Set("Content-Type", "application/json")
	if service.Auth.Type == "basic" && service.Auth.Username != "" {
		encoded := base64.StdEncoding.EncodeToString(
			[]byte(service.Auth.Username + ":" + service.Auth.Password),
		)
		req.Header.Set("Authorization", "Basic "+encoded)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", false
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusNotFound {
		return "", "", false
	}
	if resp.StatusCode >= 400 {
		return "", "", false
	}

	var payload map[string]interface{}
	if json.Unmarshal(body, &payload) != nil {
		return "", "", false
	}
	st, _ := payload["status"].(string)
	if st == "" {
		st, _ = payload["Status"].(string)
	}
	msg, _ := payload["errorResponse"].(string)
	if msg == "" {
		msg, _ = payload["ErrorResponse"].(string)
	}
	if st == "" {
		return "", "", false
	}
	return st, msg, true
}
