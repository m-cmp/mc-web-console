package repository

import (
	"fmt"
	"log"
	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 데이터베이스 초기화
func InitDatabase(cfg *config.Config) error {
	dsn := cfg.GetDatabaseDSN()

	// GORM 로거 설정
	gormLogger := logger.Default
	if cfg.Server.Env == "production" {
		gormLogger = logger.Default.LogMode(logger.Silent)
	} else {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	// 데이터베이스 연결
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 연결 풀 설정
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	DB = db

	log.Println("✅ Database connected successfully")

	return nil
}

// AutoMigrate 자동 마이그레이션
func AutoMigrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// 모델 등록
	models := []interface{}{
		&model.UserSession{},
	}

	for _, model := range models {
		if err := DB.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate %T: %w", model, err)
		}
	}

	log.Println("✅ Database migration completed")

	return nil
}

// CloseDatabase 데이터베이스 연결 종료
func CloseDatabase() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// GetDB 데이터베이스 인스턴스 반환
func GetDB() *gorm.DB {
	return DB
}
