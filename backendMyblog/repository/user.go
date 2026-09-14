// repository/user.go
package repository

import (
    "errors"
    "gorm.io/gorm"
    "xioagandashen/model"
)

type UserRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) *UserRepo { return &UserRepo{db: db} }

func (r *UserRepo) Create(u *model.User) error { return r.db.Create(u).Error }

func (r *UserRepo) FindByID(id uint64) (*model.User, error) {
    var u model.User
    err := r.db.First(&u, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
    return &u, err
}

func (r *UserRepo) FindByUsername(username string) (*model.User, error) {
    var u model.User
    err := r.db.Where("username = ?", username).First(&u).Error
    if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
    return &u, err
}

func (r *UserRepo) Update(u *model.User) error { return r.db.Save(u).Error }