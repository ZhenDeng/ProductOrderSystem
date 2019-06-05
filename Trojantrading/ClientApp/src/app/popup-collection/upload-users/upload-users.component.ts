import { Component, OnInit, Inject } from '@angular/core';
import { FileService } from '../../services/file.service';
import { ShareService } from '../../services/share.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ApiResponse } from '../../models/ApiResponse';
import * as _ from 'lodash';

@Component({
  selector: 'app-upload-users',
  templateUrl: './upload-users.component.html',
  styleUrls: ['./upload-users.component.css']
})
export class UploadUsersComponent implements OnInit {

  formData = new FormData();
  file: any;
  selectedRole: string;
  loadContent: boolean = true;

  constructor(
    private fileService: FileService,
    private shareService: ShareService,
    public dialogRef: MatDialogRef<UploadUsersComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  onSelectFile(event: any): void {
    this.file = event.target.files[0];
  }

  uploadUsers(): void {
    if(this.file){
      this.formData.append(this.file.name, this.file);
      if(_.lowerCase(this.file.name.split('.')[1]) != "xlsx" && _.lowerCase(this.file.name.split('.')[1]) != "xls"){
        this.shareService.openSnackBar("Please upload a excel file", "error");
      }else{
        this.loadContent = false;
        this.fileService.UploadUsers(this.formData).subscribe((res: ApiResponse) => {
          if(res.status == "success"){
            this.shareService.openSnackBar(res.message, "success");
            setTimeout(() => {
              this.loadContent = true;
              this.dialogRef.close();
            }, 1500);
          }else{
            this.shareService.openSnackBar(res.message, "error");
            this.loadContent = true;
          }
        },
          (error: any) => {
            console.info(error);
            this.loadContent = true;
          });
      }
    }else{
      this.shareService.openSnackBar("Upload file is empty", "error");
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
