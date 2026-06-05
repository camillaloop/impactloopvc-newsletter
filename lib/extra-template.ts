// lib/extra-template.ts
// HTML-template för extrabrevet – portad från Google Apps Script

export interface ExtraArticle {
  title: string;
  ingress: string;
  url: string;
  imageUrl: string;
  imageCaption?: string;
}

function esc(s: string): string {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

function normalizeIngress(s: string): string {
  const raw = String(s || '').trim();
  if (!raw) return '';
  if (raw.includes('<')) return raw;
  return esc(raw).replace(/\n{2,}/g, '<br><br>').replace(/\n/g, ' ');
}

export function generateExtraHtml(article: ExtraArticle, subject: string, preview: string): string {
  const { title, ingress, url, imageUrl, imageCaption } = article;
  const ingressBlock = normalizeIngress(ingress);

  return `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<!--[if gte mso 15]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(subject || title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<style>
img{-ms-interpolation-mode:bicubic;}
table, td{mso-table-lspace:0pt; mso-table-rspace:0pt;}
p, a, li, td, blockquote{mso-line-height-rule:exactly;}
p, a, li, td, body, table, blockquote{-ms-text-size-adjust:100%; -webkit-text-size-adjust:100%;}
.mcnPreviewText{display: none !important;}
.bodyCell{margin:0 auto; padding:0; width:100%;}
.ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font{line-height:100%;}
.ReadMsgBody{width:100%;} .ExternalClass{width:100%;}
a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important;}
body{height:100%; margin:0; padding:0; width:100%; background: #ffffff;}
p{margin:0; padding:0;} table{border-collapse:collapse;}
td, p, a{word-break:break-word;}
h1, h2, h3, h4, h5, h6{display:block; margin:0; padding:0;}
img, a img{border:0; height:auto; outline:none; text-decoration:none;}
a[href^="tel"], a[href^="sms"]{color:inherit; cursor:default; text-decoration:none;}
li p {margin: 0 !important;}
body, #bodyTable { background-color: rgb(244, 244, 244); }
.mceText, .mcnTextContent, .mceLabel { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; }
.mceText, .mcnTextContent, .mceLabel { color: rgb(0, 0, 0); }
.mceText h1 { margin-bottom: 0; } .mceText p { margin-bottom: 0; }
.mceText p, .mcnTextContent p { color: rgb(0, 0, 0); font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 16px; font-weight: normal; line-height: 1.35; mso-line-height-alt: 135%; text-align: left; direction: ltr; margin: 0; }
.mceText h1, .mcnTextContent h1 { color: rgb(0, 0, 0); font-family: Georgia, Times, "Times New Roman", serif; font-size: 31px; font-weight: normal; line-height: 1.25; mso-line-height-alt: 125%; text-align: left; direction: ltr; }
.mceText a[href], .mcnTextContent a[href] { color: #000 !important; text-decoration: none !important; border-bottom: 2px solid #DEF41C !important; padding-bottom: 1px !important; }
#d18 p, #d18 h1, #d18 h2, #d18 h3, #d18 h4, #d18 ul { text-align: center; }
@media only screen and (max-width: 480px) {
  body, table, td, p, a, li, blockquote{-webkit-text-size-adjust:none !important;}
  body{width:100% !important; min-width:100% !important;}
  .mceWidthContainer{max-width: 660px !important;}
  .mceColumn{display: block !important; width: 100% !important;}
  .mceBlockContainer{padding-right:16px !important; padding-left:16px !important;}
  .mceTextBlockContainer{padding-right:16px !important; padding-left:16px !important;}
  .mceText p { margin: 0; font-size: 16px !important; line-height: 1.35 !important; }
  .mceText h1 { font-size: 31px !important; line-height: 1.25 !important; }
}
</style></head>
<body>
<span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">${esc(preview)}</span>
<center>
<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="background-color: rgb(244, 244, 244);">
<tbody><tr><td class="bodyCell" align="center" valign="top">
<table id="root" border="0" cellpadding="0" cellspacing="0" width="100%">

<!-- HEADER med logga -->
<tbody data-block-id="3" class="mceWrapper"><tr><td style="background-color:#f4f4f4" valign="top" align="center">
<!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation">
<tbody><tr><td style="background-color:#ffffff" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr class="mceRow"><td valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr>
<td style="padding-top:0;padding-bottom:0" valign="top" colspan="12" width="100%">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr>
<td style="background-color:#e5ff00;padding-top:12px;padding-bottom:12px;padding-right:48px;padding-left:48px" valign="top" align="left">
<a href="http://www.impactloop.se" style="display:block" target="_blank">
<img alt="Logo" src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/64d23c33-4124-2e95-27c9-a488186b43a8.png" width="103" height="auto" style="display:block;max-width:100%;height:auto;">
</a>
</td></tr></tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
<!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
</td></tr></tbody>

<!-- BODY -->
<tbody data-block-id="16" class="mceWrapper"><tr><td style="background-color:#f4f4f4" valign="top" align="center">
<!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation">
<tbody><tr><td style="background-color:#ffffff" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr class="mceRow"><td valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr>
<td style="padding-top:0;padding-bottom:0" valign="top" colspan="12" width="100%">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody>

<!-- JUST NU-tagg -->
<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
<table width="100%" style="border:0;border-collapse:separate"><tbody><tr>
<td style="padding-left:24px;padding-right:24px;padding-top:24px;padding-bottom:12px" class="mceTextBlockContainer">
<div class="mceText" style="width:100%"><p class="last-child"><span style="color:#d0c4de;">JUST IN</span></p></div>
</td></tr></tbody></table>
</td></tr>

<!-- RUBRIK -->
<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
<table width="100%" style="border:0;border-collapse:separate"><tbody><tr>
<td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
<div class="mceText" style="width:100%">
<h1 class="last-child"><span style="color:rgb(0,0,0);font-family:Georgia,Times,'Times New Roman',serif;">${esc(title)}</span></h1>
</div>
</td></tr></tbody></table>
</td></tr>

<!-- BILD -->
<tr><td style="padding-top:12px;padding-bottom:0;padding-right:0;padding-left:0" valign="top" align="left">
<a href="${esc(url)}" style="display:block" target="_blank">
<img alt="${esc(imageCaption || '')}" src="${esc(imageUrl)}" width="660" height="auto" style="display:block;max-width:100%;height:auto;">
</a>
</td></tr>
${imageCaption ? `
<tr><td style="padding-top:4px;padding-bottom:12px;padding-right:24px;padding-left:24px" valign="top">
<p style="font-size:12px;color:#888888;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;margin:0;">${esc(imageCaption)}</p>
</td></tr>` : ''}

<!-- INGRESS + LÄS MER -->
<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
<table width="100%" style="border:0;border-collapse:separate"><tbody><tr>
<td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
<div class="mceText" style="width:100%">
<p><strong><span style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">${ingressBlock}</span></strong></p>
<p><br></p>
<p class="last-child"><a href="${esc(url)}" target="_blank"><strong>Read the article here &ndash;&ndash;&ndash;&gt;</strong></a></p>
</div>
</td></tr></tbody></table>
</td></tr>

<!-- DIVIDER -->
<tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr><td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2;" valign="top"></td></tr></tbody>
</table>
</td></tr>

<!-- OM IMPACT LOOP -->
<tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
<table width="100%" style="border:0;background-color:#EAEAEA;border-collapse:separate"><tbody><tr>
<td style="padding-left:24px;padding-right:24px;padding-top:28px;padding-bottom:28px" class="mceTextBlockContainer">
<div class="mceText" style="width:100%">
<h1>Join Europe's leading impact investors</h1>
<p><br>Impact Loop is your go-to business news platform for investors (and founders) in the European impact space.</p>
<p><br></p>
<p>👉 <a href="https://www.impactloop.com/subscribe" target="_blank"><strong>Subscribe to our paid plan</strong></a> to get unlimited access to all of our journalism.</p>
<p><br></p>
<p class="last-child">Got a news tip or want to get to know us more? <a href="mailto:sion@loop.se" target="_blank"><strong>Contact us here!</strong></a></p>
</div>
</td></tr></tbody></table>
</td></tr>

<!-- SOCIAL FOOTER (gul) -->
<tr><td style="background-color:#e5ff00;padding-top:32px;padding-bottom:12px;padding-right:0;padding-left:0" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr><td valign="top" align="center">
<table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr>
<td style="padding:3px 12px" valign="top" align="center" width="24"><a href="https://www.facebook.com/impactloop.se/" target="_blank"><img width="24" height="24" alt="Facebook" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/facebook-filled-dark-40.png"></a></td>
<td style="padding:3px 12px" valign="top" align="center" width="24"><a href="https://www.instagram.com/impactloop.se/" target="_blank"><img width="24" height="24" alt="Instagram" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/instagram-filled-dark-40.png"></a></td>
<td style="padding:3px 12px" valign="top" align="center" width="24"><a href="https://se.linkedin.com/company/impact-loop-loop" target="_blank"><img width="24" height="24" alt="LinkedIn" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/linkedin-filled-dark-40.png"></a></td>
<td style="padding:3px 12px" valign="top" align="center" width="24"><a href="https://www.threads.net/@impactloop.se" target="_blank"><img width="24" height="24" alt="Threads" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/threads-filled-dark-40.png"></a></td>
</tr></tbody></table>
</td></tr></tbody></table>
</td></tr>

</tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
<!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
</td></tr></tbody>

<!-- FOOTER -->
<tbody data-block-id="22" class="mceWrapper"><tr><td style="background-color:#f4f4f4" valign="top" align="center">
<!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation">
<tbody><tr><td style="background-color:#ffffff" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr><td valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr>
<td style="background-color:#e5ff00;padding:8px;" valign="top">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tbody><tr><td valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody>
<tr><td style="padding:12px 48px" valign="top" align="center">
<img alt="Logo" src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/64d23c33-4124-2e95-27c9-a488186b43a8.png" width="97" height="auto" style="display:block;max-width:100%;height:auto;">
</td></tr>
<tr><td style="padding:12px 16px" valign="top" align="center">
<div class="mceText" id="d18" style="display:inline-block;width:100%">
<p class="last-child"><em><span style="font-size:12px">Copyright (C) Impact Loop 2025. All rights reserved.</span></em><br><br>
<span style="font-size:12px">Want to change how you receive these emails?</span><br>
<span style="font-size:12px">You can </span><a href="https://impactloop.mailchimpsites.com/manage/preferences?u=46f8b3dcdd581118cad2f80ee&id=2575eb3724&e=[UNIQID]&c=a626e25f44"><span style="font-size:12px">update your preferences</span></a>
<span style="font-size:12px"> or </span>
<a href="*|UNSUB|*"><span style="font-size:12px">unsubscribe</span></a>
</p>
</div>
</td></tr>
</tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
</td></tr></tbody></table>
<!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
</td></tr></tbody>

</table>
</td></tr></tbody></table>
</center>
</body></html>`;
}
