import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateInvitationCodeDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
