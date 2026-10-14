package repository

import (
	"errors"
	"strings"
	"time"

	"mc_web_console_api/internal/model"

	"gorm.io/gorm"
)

// AsyncRequestRepository persists async request tracking rows.
type AsyncRequestRepository struct {
	db *gorm.DB
}

// NewAsyncRequestRepository creates a repository.
func NewAsyncRequestRepository(db *gorm.DB) *AsyncRequestRepository {
	return &AsyncRequestRepository{db: db}
}

// UpsertHandling inserts a Handling row or refreshes label/href/ns without
// overwriting started_at or a terminal status.
func (r *AsyncRequestRepository) UpsertHandling(row *model.AsyncRequest) error {
	if r == nil || r.db == nil || row == nil {
		return errors.New("async request repository not ready")
	}
	if row.Status == "" {
		row.Status = model.AsyncStatusHandling
	}
	if row.StartedAt.IsZero() {
		row.StartedAt = time.Now().UTC()
	}

	var existing model.AsyncRequest
	err := r.db.Where("request_id = ?", row.RequestID).First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return r.db.Create(row).Error
		}
		return err
	}

	updates := map[string]interface{}{}
	if row.Label != "" && existing.Label == "" {
		updates["label"] = row.Label
	} else if row.Label != "" {
		updates["label"] = row.Label
	}
	if row.Href != "" {
		updates["href"] = row.Href
	}
	if row.NsID != "" {
		updates["ns_id"] = row.NsID
	}
	if row.UserID != "" && existing.UserID == "" {
		updates["user_id"] = row.UserID
	}
	if existing.Status == model.AsyncStatusHandling {
		// keep Handling; no started_at overwrite
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.Model(&existing).Updates(updates).Error
}

// UpdateStatus updates status/message/finished_at on the same request_id row.
// finished_at is set only on first transition to a terminal status.
func (r *AsyncRequestRepository) UpdateStatus(
	requestID, status, message string,
) error {
	if r == nil || r.db == nil {
		return errors.New("async request repository not ready")
	}
	var existing model.AsyncRequest
	if err := r.db.Where("request_id = ?", requestID).First(&existing).Error; err != nil {
		return err
	}
	updates := map[string]interface{}{
		"status": status,
	}
	if message != "" {
		updates["message"] = message
	}
	terminal := status == model.AsyncStatusSuccess ||
		status == model.AsyncStatusError ||
		status == model.AsyncStatusTimeout
	if terminal && existing.FinishedAt == nil {
		now := time.Now().UTC()
		updates["finished_at"] = now
	}
	return r.db.Model(&existing).Updates(updates).Error
}

// ListByUser returns a page of jobs for a user (Handling first), optionally
// filtered by a case-insensitive keyword over the fields the dropdown shows,
// plus the total count matching the same filter.
func (r *AsyncRequestRepository) ListByUser(
	userID, q string, offset, limit int,
) ([]model.AsyncRequest, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	filtered := func() *gorm.DB {
		tx := r.db.Model(&model.AsyncRequest{}).Where("user_id = ?", userID)
		if q != "" {
			like := "%" + strings.ToLower(q) + "%"
			tx = tx.Where(
				"LOWER(label) LIKE ? OR LOWER(operation_id) LIKE ? OR LOWER(request_id) LIKE ?"+
					" OR LOWER(status) LIKE ? OR LOWER(message) LIKE ?",
				like, like, like, like, like,
			)
		}
		return tx
	}
	var total int64
	if err := filtered().Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []model.AsyncRequest
	err := filtered().
		Order("CASE WHEN status = 'Handling' THEN 0 ELSE 1 END ASC").
		Order("started_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&rows).Error
	return rows, total, err
}

// ListHandling returns Handling rows newer than since for the poller.
func (r *AsyncRequestRepository) ListHandling(since time.Time) ([]model.AsyncRequest, error) {
	var rows []model.AsyncRequest
	err := r.db.Where("status = ? AND started_at >= ?", model.AsyncStatusHandling, since).
		Order("started_at ASC").
		Limit(200).
		Find(&rows).Error
	return rows, err
}

// DeleteByRequestIDAndUser deletes one row owned by userID.
func (r *AsyncRequestRepository) DeleteByRequestIDAndUser(requestID, userID string) error {
	return r.db.Where("request_id = ? AND user_id = ?", requestID, userID).
		Delete(&model.AsyncRequest{}).Error
}

// DeleteFinishedByUser deletes terminal rows for a user.
func (r *AsyncRequestRepository) DeleteFinishedByUser(userID string) error {
	return r.db.Where(
		"user_id = ? AND status IN ?",
		userID,
		[]string{
			model.AsyncStatusSuccess,
			model.AsyncStatusError,
			model.AsyncStatusTimeout,
		},
	).Delete(&model.AsyncRequest{}).Error
}

// PatchMeta updates label/href/ns for a user's request.
func (r *AsyncRequestRepository) PatchMeta(
	requestID, userID, label, href, nsID string,
) error {
	updates := map[string]interface{}{}
	if label != "" {
		updates["label"] = label
	}
	if href != "" {
		updates["href"] = href
	}
	if nsID != "" {
		updates["ns_id"] = nsID
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.Model(&model.AsyncRequest{}).
		Where("request_id = ? AND user_id = ?", requestID, userID).
		Updates(updates).Error
}
