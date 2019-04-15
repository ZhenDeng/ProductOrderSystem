using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace Trojantrading.Models
{
    public class User
    {
        public int Id { get; set; }

        public DateTime CreatedDate { get; set; }

        public string Account { get; set; }

        public string PassswordHash { get; set; }

        public string PasswordSalt { get; set; }

        public string Password { get; set; }

        public string BussinessName { get; set; }

        public string PostCode { get; set; }

        public string Trn { get; set; }

        public string Email { get; set; }

        public string Mobile { get; set; }
        public string Phone { get; set; }

        public string Status { get; set; }

        public bool SendEmail { get; set; }

        public ShoppingCart ShoppingCart { get; set; }

        public List<Order> Orders { get; set; }

        public UserRole UserRole { get; set; }
        public ShippingAddress ShippingAddress { get; set; }
        public BillingAddress BillingAddress { get; set; }

        public List<ShoppingItem> ShoppingItems { get; set; }
    }

    public class AppSettings
    {
        public string Secret { get; set; }
    }
}