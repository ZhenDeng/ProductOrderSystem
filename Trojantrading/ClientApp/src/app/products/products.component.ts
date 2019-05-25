import { ProductService } from './../services/product.service';
import { Product, Category } from './../models/Product';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatDialog } from '@angular/material';
import { Menu } from '../models/menu';
import { ShareService } from '../services/share.service';
import { NavbarService } from '../services/navbar.service';
import { ApiResponse } from '../models/ApiResponse';
import { EditProductComponent } from '../popup-collection/edit-product/edit-product.component';
import { Subject } from 'rxjs';
import 'rxjs/add/operator/takeUntil';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {

  products: Product[] = [];

  filteredProducts: Product[] = [];

  dataSource = new MatTableDataSource();

  viewType: string;

  title: string = '';

  displayedColumns: string[];

  role: string;

  categoryList: Category[] = [];

  loadContent: boolean = false;

  navLinks: Menu[] = [
    {
      path: '/home',
      label: 'All Products',
      id: 'allProducts'
    },
    {
      path: '/productsview/new',
      label: 'New Product',
      id: 'newProduct'
    },
    {
      path: '/productsview/promotion',
      label: 'Promotions',
      id: 'promotions'
    },
    {
      path: '/productsview/soldout',
      label: 'Sold Out',
      id: 'soldout'
    },
  ];

   //unsubscribe
   ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private router: Router,
    public nav: NavbarService,
    private activatedRouter: ActivatedRoute,
    private productService: ProductService,
    private shareService: ShareService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.nav.show();
    this.loadContent = false;
    this.categoryList = this.productService.categoryList;
    this.role = this.shareService.readCookie("role");
    if (this.shareService.readCookie("role") && this.shareService.readCookie("role") == "admin") {
      this.displayedColumns = ['name', 'category', 'originalPrice', 'agentPrice', 'wholesalerPrice', 'status', 'button']
    }
    else if (this.shareService.readCookie("role") && this.shareService.readCookie("role") == "agent") {
      this.displayedColumns = ['name', 'category', 'originalPrice', 'agentPrice', 'qty', 'status', 'button']
    }
    else if (this.shareService.readCookie("role") && this.shareService.readCookie("role") == "wholesaler") {
      this.displayedColumns = ['name', 'category', 'originalPrice', 'wholesalerPrice', 'qty', 'status', 'button']
    } else {
      this.displayedColumns = ['name', 'category', 'originalPrice', 'qty', 'status', 'button']
    }
    this.activatedRouter.paramMap.subscribe(param => {
      this.viewType = param.get('type');
      const type = this.viewType.toLowerCase();
      if (type === 'new') {
        this.title = 'New Products';
      } else if (type.includes('promotion')) {
        this.title = 'Promotions';
      } else {
        this.title = 'Sold Out';
      }
      if (!this.products.length) {
        this.getProducts(type);
      } else {
        this.filterProducts(type, this.products);
      }
      this.loadContent = true;
    },
      (error: any) => {
        this.loadContent = true;
        console.info(error);
      });
  }

  getProducts(type: string) {
    this.loadContent = false;
    this.productService.getAllProducts().takeUntil(this.ngUnsubscribe)
    .subscribe((value: Product[]) => {
      this.loadContent = true;
      this.products = value;
      this.filterProducts(type, value);
    });
  }

  filterProducts(type: string, value: Product[]) {
    this.filteredProducts = value.filter(x => x.status && x.status.toLowerCase().trim().includes(type.toLowerCase().trim()));
    this.filteredProducts.forEach(product => product.quantity = 0);
    this.dataSource = new MatTableDataSource(this.filteredProducts);
  }

  applyFilter(value: string) {
    value = value.trim();
    value = value.toLowerCase();
    this.dataSource.filter = value;
  }

  _keyPress(event: any) {
    const pattern = /[0-9\+\-\ ]/;
    let inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  addNewProduct(): void {
    const dialogRef = this.dialog.open(EditProductComponent, {
      width: '700px',
      data: { categorys: this.productService.categoryList, type: "Add" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadContent = false;
        this.productService.AddProduct(result).subscribe((res: ApiResponse) => {
          if (res.status == "success") {
            this.shareService.showSuccess(".addnewproduct", res.message, "right");
            setTimeout(() => {
              this.activatedRouter.paramMap.subscribe(param => {
                this.viewType = param.get('type');
                const type = this.viewType.toLowerCase();
                if (type === 'new') {
                  this.title = 'New Products';
                } else if (type.includes('promotion')) {
                  this.title = 'Promotions';
                } else {
                  this.title = 'Sold Out';
                }
                if (!this.products.length) {
                  this.getProducts(type);
                } else {
                  this.filterProducts(type, this.products);
                }
              });
            }, 2000);
          } else {
            this.loadContent = true;
            this.shareService.showError(".addnewproduct", res.message, "right");
          }
        },
          (error: any) => {
            this.loadContent = true;
            console.info(error);
          });
      }
    });
  }

  editProduct(product: Product): void {
    const dialogRef = this.dialog.open(EditProductComponent, {
      width: '700px',
      data: { product: product, categorys: this.productService.categoryList, type: "Update" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadContent = false;
        product.name = result.name;
        product.category = result.category;
        product.agentPrice = result.agentPrice;
        product.originalPrice = result.originalPrice;
        product.wholesalerPrice = result.wholesalerPrice;
        this.productService.UpdateProduct(product).subscribe((res: ApiResponse) => {
          if (res.status == "success") {
            this.shareService.showSuccess("#" + product.id, res.message, "right");
            setTimeout(() => {
              this.activatedRouter.paramMap.subscribe(param => {
                this.viewType = param.get('type');
                const type = this.viewType.toLowerCase();
                if (type === 'new') {
                  this.title = 'New Products';
                } else if (type.includes('promotion')) {
                  this.title = 'Promotions';
                } else {
                  this.title = 'Sold Out';
                }
                if (!this.products.length) {
                  this.getProducts(type);
                } else {
                  this.filterProducts(type, this.products);
                }
              });
            }, 2000);
          } else {
            this.loadContent = true;
            this.shareService.showError("#" + product.id, res.message, "right");
          }
        },
          (error: any) => {
            this.loadContent = true;
            console.info(error);
          });
      }
    });
  }

  manageRedirect(category: string) {
    this.dataSource.filter = category;
  }

  changeQuantity(element: Product): void {
    if (element.quantity < 0) {
      element.quantity = 0;
      this.shareService.showError("#product" + element.id, "Minimum qty is 0", "right");
    }
  }

  switchLabel(id: string): void{
    if(id == "allProducts"){
      this.dataSource.filter ="";
    }else{
      this.activatedRouter.paramMap.subscribe(param => {
        this.viewType = param.get('type');
        const type = this.viewType.toLowerCase();
        this.filterProducts(type, this.products);
      });
    }
  }

  onLoading(currentLoadingStatus: boolean) {
    this.loadContent = !currentLoadingStatus;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
