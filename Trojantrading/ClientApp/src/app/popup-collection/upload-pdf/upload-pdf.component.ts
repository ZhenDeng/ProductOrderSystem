import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileService } from '../../services/file.service';
import { ApiResponse } from '../../models/ApiResponse';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-upload-pdf',
  templateUrl: './upload-pdf.component.html',
  styleUrls: ['./upload-pdf.component.css']
})
export class UploadPdfComponent implements OnInit {

  formData = new FormData();
  file: any;
  selectedRole: string;

  constructor(
    private fileService: FileService,
    private shareService: ShareService,
    public dialogRef: MatDialogRef<UploadPdfComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    this.selectedRole = "agent";
  }

  onSelectFile(event: any): void {
    this.file = event.target.files[0];
  }

  uploadPdf(): void {

    this.formData.append(this.file.name, this.file);
    this.fileService.SavePdf(this.selectedRole, this.formData).subscribe((res: ApiResponse) => {
      if (res.status == "success") {
        this.shareService.showSuccess(".uploadpdf", res.message, "right");
        setTimeout(() => {
          this.dialogRef.close();
        }, 1500);
      } else {
        this.shareService.showError(".uploadpdf", res.message, "right");
      }
    },
      (error: any) => {
        console.info(error);
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}