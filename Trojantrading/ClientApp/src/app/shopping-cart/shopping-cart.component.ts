import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarService } from '../services/navbar.service';
import { ShareService } from '../services/share.service';
import { ShoppingCartService } from '../services/shopping-cart.service';
import { ShoppingCart } from '../models/shoppingCart';
import { AdminService } from '../services/admin.service';
import { Router } from '@angular/router';
import { ShoppingItem } from '../models/shoppingItem';
import { ApiResponse } from '../models/ApiResponse';
import { OrderService } from '../services/order.service';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import 'rxjs/add/operator/takeUntil';
import { DeleteConfirmComponent } from '../popup-collection/delete-confirm/delete-confirm.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit, OnDestroy {

  dataSource: ShoppingItem[];
  displayedColumns: string[] = [];
  shoppingCart: ShoppingCart;
  priceExclGst: number;
  oringinalPriceIncGst: number;
  oringinalPriceExclGst: number;
  gst: number;
  priceIncGst: number;
  discount: number;
  role: string = this.shareService.readCookie("role");
  successCheckout: boolean = false;
  selectedPayment: string;
  loadContent = false;
  shoppingCartId: number;

  //unsubscribe
  ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private nav: NavbarService,
    private shareService: ShareService,
    private shoppingCartService: ShoppingCartService,
    private adminService: AdminService,
    private router: Router,
    private orderService: OrderService,
    private dialog: MatDialog
  ) {
    if (this.shareService.readCookie("role") && this.shareService.readCookie("role") == "agent") {
      this.displayedColumns = ['itemcode','name', 'category', 'packaging', 'originalPrice', 'agentPrice', 'qty', 'subTotal', 'remove'];
    }
    else if (this.shareService.readCookie("role") && this.shareService.readCookie("role") == "wholesaler") {
      this.displayedColumns = ['itemcode','name', 'category', 'packaging', 'originalPrice', 'wholesalerPrice', 'prepaymentDiscount', 'qty', 'subTotal', 'remove'];
    }
  }

  ngOnInit() {

    this.nav.show();
    this.selectedPayment = "onaccount";
    this.successCheckout = false;
    this.shoppingCartService.currentShoppingItemLength.subscribe((length: number) => {
      this.shoppingCartService.GetShoppingCart(_.toNumber(this.shareService.readCookie("userId"))).takeUntil(this.ngUnsubscribe)
        .subscribe((res: ShoppingCart) => {
          this.priceExclGst = 0;
          this.gst = 0;
          this.priceIncGst = 0;
          this.oringinalPriceExclGst = 0;
          this.oringinalPriceIncGst = 0;
          this.discount = 0;
          this.shoppingCart = res;
          this.dataSource = this.shoppingCart.shoppingItems;
          if (res.shoppingItems.length) {
            this.updatePrice();
          }
        },
          (error: any) => {
            console.info(error);
          });
    },
      (error: any) => {
        console.info(error);
      });
  }

  continueShopping(): void {
    this.successCheckout = false;
    this.router.navigate(['/home']);
  }

  checkoutShoppingItems(): void {
    this.shoppingCart.paymentMethod = this.selectedPayment;
    this.loadContent = false;
    this.orderService.AddOrder(this.shoppingCart, this.gst, this.priceExclGst, this.discount).subscribe((res: ApiResponse) => {
      if (res && res.status == "success") {
        this.shoppingCartService.GetCartInIdWithShoppingItems(this.shoppingCart.id).subscribe((res: ShoppingCart) => {
          this.priceExclGst = 0;
          this.gst = 0;
          this.priceIncGst = 0;
          this.discount = 0;
          this.oringinalPriceExclGst = 0;
          this.oringinalPriceIncGst = 0;
          this.shoppingCart = res;
          this.dataSource = this.shoppingCart.shoppingItems;
          this.successCheckout = true;
          this.shoppingCartService.MonitorShoppingItemLength(this.dataSource.length);
          this.loadContent = true;
        },
          (error: any) => {
            console.info(error);
            this.loadContent = true;
          });
      } else {
        this.shareService.openSnackBar(res.message, "error");
      }
    },
      (error: any) => {
        console.info(error);
      });
  }

  deleteShoppingItem(shoppingItem: ShoppingItem): void {
    const dialogRef = this.dialog.open(DeleteConfirmComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.shoppingCartService.DeleteShoppingItem(shoppingItem.id).subscribe((res: ApiResponse) => {
          if (res && res.status == "success") {
            this.shoppingCartService.GetShoppingCart(_.toNumber(this.shareService.readCookie("userId"))).subscribe((res: ShoppingCart) => {
              this.shoppingCart = res;
              this.dataSource = this.shoppingCart.shoppingItems;
              this.shoppingCartService.MonitorShoppingItemLength(this.dataSource.length);
              if (res && res.shoppingItems.length) {
                this.updatePrice();
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
      }
    });

  }

  changeQuantity(item: ShoppingItem): void {
    if (item.amount < 1) {
      item.amount = 1;
      this.shareService.openSnackBar("Minimum qty is 1", "error");
    } else {
      this.updatePrice();
    }
    this.shoppingCart.totalItems = 0;
    this.dataSource.forEach(si => {
      this.shoppingCart.totalItems += si.amount;
    });
  }

  updatePrice(): void {
    this.priceExclGst = 0;
    this.gst = 0;
    this.priceIncGst = 0;
    this.discount = 0;
    this.oringinalPriceExclGst = 0;
    this.oringinalPriceIncGst = 0;
    if (this.selectedPayment == "onaccount") {
      this.dataSource.forEach(si => {
        this.oringinalPriceIncGst += si.amount * si.product.originalPrice;
        if (this.role == "agent") {
          si.subTotal = si.amount * si.product.agentPrice;
          this.priceIncGst += si.subTotal;
        } else if (this.role == "wholesaler") {
          si.subTotal = si.amount * si.product.wholesalerPrice;
          this.priceIncGst += si.subTotal;
        }
      });
      this.gst = this.priceIncGst/11;
      this.shoppingCart.totalPrice = this.priceIncGst;
      this.priceExclGst = this.priceIncGst/11*10;
      this.discount = this.oringinalPriceIncGst - this.priceIncGst;
    } else {
      this.dataSource.forEach(si => {
        this.oringinalPriceIncGst += si.amount * si.product.originalPrice;
        si.subTotal = si.amount * si.product.prepaymentDiscount;
        this.priceIncGst += si.subTotal;
      });
      
      this.priceExclGst = this.priceIncGst/11*10;
      this.gst = this.priceIncGst/11;
      this.shoppingCart.totalPrice = this.priceIncGst;
      this.discount = this.oringinalPriceIncGst - this.priceIncGst;
    }
  }

  changePaymentMethod(): void {
    this.priceExclGst = 0;
    this.gst = 0;
    this.priceIncGst = 0;
    this.discount = 0;
    this.oringinalPriceExclGst = 0;
    this.oringinalPriceIncGst = 0;
    this.loadContent = false;
    this.shoppingCartService.UpdateShoppingCartPaymentMethod(_.toNumber(this.shareService.readCookie("userId")), this.selectedPayment).subscribe((res: ApiResponse) => {
      this.loadContent = true;
      if (res && res.status == "success") {
        if (this.selectedPayment == "onaccount") {
          this.dataSource.forEach(si => {
            this.oringinalPriceIncGst += si.amount * si.product.originalPrice;
            if (this.role == "agent") {
              si.subTotal = si.amount * si.product.agentPrice;
              this.priceIncGst += si.subTotal;
            } else if (this.role == "wholesaler") {
              si.subTotal = si.amount * si.product.wholesalerPrice;
              this.priceIncGst += si.subTotal;
            }
          });
          this.gst = this.priceIncGst/11;
          this.shoppingCart.totalPrice = this.priceIncGst;
          this.priceExclGst = this.priceIncGst/11*10;
          this.discount = this.oringinalPriceIncGst - this.priceIncGst;
        } else {
          this.dataSource.forEach(si => {
            this.oringinalPriceIncGst += si.amount * si.product.originalPrice;
            si.subTotal = si.amount * si.product.prepaymentDiscount;
            this.priceIncGst += si.subTotal;
          });
          
          this.priceExclGst = this.priceIncGst/11*10;
          this.gst = this.priceIncGst/11;
          this.shoppingCart.totalPrice = this.priceIncGst;
          this.discount = this.oringinalPriceIncGst - this.priceIncGst;
        }
      } else {
        if (this.selectedPayment == "prepay") {
          this.selectedPayment = "onaccount";
        } else {
          this.selectedPayment = "prepay";
        }
        this.shareService.openSnackBar(res.message, "error");
      }
    },
      (error: any) => {
        console.info(error);
        this.loadContent = true;
      });
  }

  onLoading(currentLoadingStatus: boolean) {
    this.loadContent = !currentLoadingStatus;
  }

  isNumberKey(event: any) {
    const pattern = /[0-9\+\-\ ]/;
    let inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
