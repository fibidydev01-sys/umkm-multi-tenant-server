import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsObject,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama toko minimal 3 karakter' })
  @MaxLength(100, { message: 'Nama toko maksimal 100 karakter' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^62[0-9]{9,13}$/, {
    message: 'Format WhatsApp harus diawali 62 (contoh: 6281234567890)',
  })
  whatsapp?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Alamat maksimal 300 karakter' })
  address?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsObject()
  theme?: {
    primaryColor?: string;
  };
}
