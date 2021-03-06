import { Subject } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { User } from '../models/user';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ShoppingItem } from '../models/shoppingItem';
import { Order } from '../models/order';
import { ShoppingCart } from '../models/shoppingCart';
import { ShareService } from '../services/share.service';
import { Router } from '@angular/router';
import { NavbarService } from '../services/navbar.service';
import { ApiResponse } from '../models/ApiResponse';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { EditAddressComponent } from '../popup-collection/edit-address/edit-address.component';
import 'rxjs/add/operator/takeUntil';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.css']
})
export class AccountDetailsComponent implements OnInit, OnDestroy {

  user: User;
  shoppingCart: ShoppingCart;
  title: string = "My Account";
  userFormGroup: FormGroup;
  userPasswordGroup: FormGroup;
  shoppingItems: ShoppingItem[];
  orders: Order[];
  hidePassword: boolean = true;
  hideNewPassword: boolean = true;
  hideConfirmPassword: boolean = true;
  loadContent: boolean = false;

  //unsubscribe
  ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private shareService: ShareService,
    private router: Router,
    public nav: NavbarService,
    public dialog: MatDialog
  ) {
    this.userFormGroup = this.formBuilder.group({
      trn: new FormControl(""),
      abn: new FormControl("", Validators.compose([Validators.required])),
      email: new FormControl("", Validators.compose([Validators.required])),
      phone: new FormControl("", Validators.compose([Validators.required])),
      mobile: new FormControl(""),
    });

    this.userPasswordGroup = this.formBuilder.group({
      password: new FormControl("", Validators.compose([Validators.required])),
      newpassord: new FormControl("", Validators.compose([Validators.required])),
      confirmpassord: new FormControl("", Validators.compose([Validators.required]))
    });
  }

  ngOnInit() {
    
    this.nav.show();
    this.adminService.GetUserByAccount(_.toNumber(this.shareService.readCookie("userId"))).takeUntil(this.ngUnsubscribe)
    .subscribe((res: User) => {
      this.user = res;
      this.userFormGroup.get("trn").setValue(this.user.trn);
      this.userFormGroup.get("abn").setValue(this.user.abn);
      this.userFormGroup.get("email").setValue(this.user.email);
      this.userFormGroup.get("phone").setValue(this.user.phone);
      this.userFormGroup.get("mobile").setValue(this.user.mobile);
    },
      (error: any) => {
        console.info(error);
      });
  }

  updateInfo(): void {
    if (!this.userFormGroup.get("abn").valid) {
      this.shareService.openSnackBar("Australian Business Number can not be empty", "error");
    }
    if (!this.userFormGroup.get("email").valid) {
      this.shareService.openSnackBar("Email can not be empty", "error");
    }
    if (!this.userFormGroup.get("phone").valid) {
      this.shareService.openSnackBar("Phone can not be empty", "error");
    }
    if (!this.userFormGroup.get("mobile").valid) {
      this.shareService.openSnackBar("Mobile can not be empty", "error");
    }
    if (this.userFormGroup.valid) {
      this.user.trn = this.userFormGroup.get("trn").value;
      this.user.abn = this.userFormGroup.get("abn").value;
      this.user.email = this.userFormGroup.get("email").value;
      this.user.phone = this.userFormGroup.get("phone").value;
      this.user.mobile = this.userFormGroup.get("mobile").value;
      this.adminService.UpdateUser(this.user).subscribe((res: ApiResponse) => {
        if (res && res.status == "success") {
          this.shareService.openSnackBar(res.message, "success");
          setTimeout(() => {
            this.adminService.GetUserByAccount(_.toNumber(this.shareService.readCookie("userId"))).subscribe((res: User) => {
              this.user = res;
              this.userFormGroup.get("trn").setValue(this.user.trn);
              this.userFormGroup.get("abn").setValue(this.user.abn);
              this.userFormGroup.get("email").setValue(this.user.email);
              this.userFormGroup.get("phone").setValue(this.user.phone);
              this.userFormGroup.get("mobile").setValue(this.user.mobile);
            },
              (error: any) => {
                console.info(error);
              });
          }, 2000);
        } else {
          this.shareService.openSnackBar(res.message, "error");
        }
      },
        (error: any) => {
          console.info(error);
        });
    }
  }

  updatePassword(): void {
    if (!this.userPasswordGroup.get("password").valid) {
      this.shareService.openSnackBar("Current password can not be empty", "error");
    }
    if (!this.userPasswordGroup.get("newpassord").valid) {
      this.shareService.openSnackBar("New password can not be empty", "error");
    }
    if (!this.userPasswordGroup.get("confirmpassord").valid) {
      this.shareService.openSnackBar("Confirm password can not be empty", "error");
    }
    if (this.userPasswordGroup.valid) {
      if (this.userPasswordGroup.get("confirmpassord").value == this.userPasswordGroup.get("newpassord").value) {
        if(this.userPasswordGroup.get("newpassord").value.length>5){
          this.adminService.ValidatePassword(_.toNumber(this.shareService.readCookie("userId")), this.userPasswordGroup.get("password").value).subscribe((res: ApiResponse) => {
            if (res && res.status == "success") {
              this.adminService.UpdatePassword(_.toNumber(this.shareService.readCookie("userId")), this.userPasswordGroup.get("newpassord").value).subscribe((res: ApiResponse) => {
                if(res && res.status == "success"){
                  this.shareService.openSnackBar(res.message, "success");
                }else{
                  this.shareService.openSnackBar(res.message, "error");
                }
              },
                (error: any) => {
                  console.info(error);
                });
            } else {
              this.shareService.openSnackBar(res.message, "error");
            }
          },
            (error: any) => {
              console.info(error);
            });
        }else{
          this.shareService.openSnackBar("Your password Must be at least 6 characters long", "error");
        }
      } else {
        this.shareService.openSnackBar("Confirm password must be the same as new password", "error");
      }
    }
  }

  editAddress(type: string): void{
    const dialogRef = this.dialog.open(EditAddressComponent, {
      width: '700px',
      data: { user: this.user, type: type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.UpdateUser(result).subscribe((res: ApiResponse) => {
          if (res && res.status == "success") {
            this.shareService.openSnackBar(res.message, "success");
            setTimeout(() => {
              this.adminService.GetUserByAccount(_.toNumber(this.shareService.readCookie("userId"))).subscribe((res: User) => {
                this.user = res;
                this.userFormGroup.get("trn").setValue(this.user.trn);
                this.userFormGroup.get("abn").setValue(this.user.abn);
                this.userFormGroup.get("email").setValue(this.user.email);
                this.userFormGroup.get("phone").setValue(this.user.phone);
                this.userFormGroup.get("mobile").setValue(this.user.mobile);
              },
                (error: any) => {
                  console.info(error);
                });
            }, 2000);
          } else {
            this.shareService.openSnackBar(res.message, "error");
          }
        },
          (error: any) => {
            console.info(error);
          });
      }
    });
  }

  onLoading(currentLoadingStatus: boolean) {
    this.loadContent = !currentLoadingStatus;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  backToProduct(): void {
    this.router.navigate(["/home"]);
  }
}
