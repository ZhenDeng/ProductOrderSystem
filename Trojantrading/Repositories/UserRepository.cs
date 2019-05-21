using System.Threading.Tasks;
using Trojantrading.Models;
using System.Linq;
using System.Collections.Generic;
using System;
using System.Text;
using Trojantrading.Service;

namespace Trojantrading.Repositories
{
    public interface IUserRepository
    {
        ApiResponse AddUser(User user);
        ApiResponse DeleteUser(int id);
        ApiResponse Update(User user);
        User GetUserByAccount(int userId);
        List<User> GetUsers();
        ApiResponse ValidateEmail(string email);
        ApiResponse UpdatePassword(int userId, string newPassword);
        ApiResponse ValidatePassword(int userId, string password);
    }

    public class UserRepository:IUserRepository
    {
        private readonly TrojantradingDbContext trojantradingDbContext;
        private readonly IShare share;

        public UserRepository(TrojantradingDbContext trojantradingDbContext, IShare share)
        {
            this.trojantradingDbContext = trojantradingDbContext;
            this.share = share;
        }

        public ApiResponse AddUser(User user)
        {
            try
            {
                StringBuilder builder = new StringBuilder();
                builder.Append(share.RandomString(4, true));
                builder.Append(share.RandomNumber(1000, 9999));
                builder.Append(share.RandomString(2, false));
                user.Password = builder.ToString();
                trojantradingDbContext.Users.Add(user);
                trojantradingDbContext.SaveChanges();
                return new ApiResponse() {
                    Status = "success",
                    Message = "Successfully add user"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
            
        }

        public ApiResponse DeleteUser(int id)
        {
            try
            {
                var user = trojantradingDbContext.Users.Where(u => u.Id == id).FirstOrDefault();
                trojantradingDbContext.Users.Remove(user);
                trojantradingDbContext.SaveChanges();
                return new ApiResponse()
                {
                    Status = "success",
                    Message = "Successfully delete user"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
        }

        public User GetUserByAccount(int userId)
        {
            var user = trojantradingDbContext.Users
                .Where(u=>u.Id == userId)
                .FirstOrDefault();
            return user;
        }

        public List<User> GetUsers()
        {
            var users = trojantradingDbContext.Users.ToList();
            return users;
        }

        public ApiResponse Update(User user)
        {
            try
            {
                trojantradingDbContext.Users.Update(user);
                trojantradingDbContext.SaveChanges();
                return new ApiResponse() {
                    Status = "success",
                    Message = "Successfully update user"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
        }

        public ApiResponse UpdatePassword(int userId, string newPassword)
        {
            try
            {
                User user = trojantradingDbContext.Users.Where(item => item.Id == userId).FirstOrDefault();
                user.Password = newPassword;
                trojantradingDbContext.Users.Update(user);
                trojantradingDbContext.SaveChanges();

                return new ApiResponse()
                {
                    Status = "success",
                    Message = "Successfully update the password"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
        }

        public ApiResponse ValidateEmail(string email)
        {
            try
            {
                string userName = trojantradingDbContext.Users.Where(user => user.Email == email).FirstOrDefault().Account;
                if (!string.IsNullOrEmpty(userName))
                {
                    return new ApiResponse()
                    {
                        Status = "success",
                        Message = "Email Address is Valid"
                    };
                }
                else
                {
                    return new ApiResponse()
                    {
                        Status = "fail",
                        Message = "This email address is not register in our website"
                    };
                }

            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
        }

        public ApiResponse ValidatePassword(int userId, string password)
        {
            try
            {
                var userModel = trojantradingDbContext.Users.Where(user => user.Id == userId).FirstOrDefault();
                if (userModel.Password == password)
                {
                    return new ApiResponse()
                    {
                        Status = "success",
                        Message = "Successfully validate your password"
                    };
                }
                else
                {
                    return new ApiResponse()
                    {
                        Status = "fail",
                        Message = "Please input validate password"
                    };
                }

            }
            catch (Exception ex)
            {
                return new ApiResponse()
                {
                    Status = "fail",
                    Message = ex.Message
                };
            }
        }

        private string CreatePassword(int length)
        {
            const string valid = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            StringBuilder res = new StringBuilder();
            Random rnd = new Random();
            while (0 < length--)
            {
                res.Append(valid[rnd.Next(valid.Length)]);
            }
            return res.ToString();
        }
    }
}