// service/user.go
package service

import (
	"errors"
	"xioagandashen/dto"
	"xioagandashen/model"
	"xioagandashen/repository"
	"xioagandashen/utils"
)

type UserService struct{ repo *repository.UserRepo }

func NewUserService(r *repository.UserRepo) *UserService { return &UserService{repo: r} }

// 注册
func (s *UserService) Register(req dto.RegisterReq) (*model.User, error) {
    if exist, _ := s.repo.FindByUsername(req.Username); exist != nil {
        return nil, errors.New("用户名已存在")
    }
    hash, err := utils.HashPassword(req.Password)
    if err != nil { return nil, err }

    nick := req.Nickname
    if nick == "" { nick = req.Username }

    u := &model.User{
        Username: req.Username,
        Password: hash,
        Nickname: nick,
        Email:    req.Email,
        Role:     2,
        Status:   1,
    }
    if err := s.repo.Create(u); err != nil { return nil, err }
    return u, nil
}

// 登录
func (s *UserService) Login(req dto.LoginReq) (*model.User, error) {
    u, err := s.repo.FindByUsername(req.Username)
    if err != nil { return nil, err }
    if u == nil || !utils.CheckPassword(u.Password, req.Password) {
        return nil, errors.New("用户名或密码错误")
    }
    if u.Status == 0 { return nil, errors.New("账号已被禁用") }
    return u, nil
}

// 更新资料
func (s *UserService) UpdateProfile(id uint64, req dto.UpdateProfileReq) (*model.User, error) {
    u, err := s.repo.FindByID(id)
    if err != nil || u == nil { return nil, errors.New("用户不存在") }

    if req.Nickname != "" { u.Nickname = req.Nickname }
    if req.Email != ""    { u.Email = req.Email }
    if req.Avatar != ""   { u.Avatar = req.Avatar }
    if req.Bio != ""      { u.Bio = req.Bio }

    if err := s.repo.Update(u); err != nil { return nil, err }
    return u, nil
}

// 修改密码
func (s *UserService) ChangePassword(id uint64, req dto.ChangePasswordReq) error {
    u, err := s.repo.FindByID(id)
    if err != nil || u == nil { return errors.New("用户不存在") }
    if !utils.CheckPassword(u.Password, req.OldPassword) {
        return errors.New("原密码错误")
    }
    hash, err := utils.HashPassword(req.NewPassword)
    if err != nil { return err }
    u.Password = hash
    return s.repo.Update(u)
}

// 转响应体
func ToUserResp(u *model.User) dto.UserResp {
    return dto.UserResp{
        ID: u.ID, Username: u.Username, Nickname: u.Nickname,
        Email: u.Email, Avatar: u.Avatar, Bio: u.Bio,
        Role: u.Role, Status: u.Status,
        CreateTime: u.CreateTime.Format("2006-01-02 15:04:05"),
    }
}

// service/user.go
func (s *UserService) GetByID(id uint64) (*model.User, error) {
    u, err := s.repo.FindByID(id)
    if err != nil {
        return nil, err
    }
    if u == nil {
        return nil, errors.New("用户不存在")
    }
    return u, nil
}