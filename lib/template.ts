// ──────────────────────────────────────────────────────────────────────────────
// lib/template.ts
// Exakt HTML-mall från Mailchimp/GAS – ändra INTE strukturen.
// Använd generateNewsletterHTML() för att fylla i platshållare.
// ──────────────────────────────────────────────────────────────────────────────

export const NEWSLETTER_HTML_TEMPLATE = `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><!--[if gte mso 15]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="x-apple-disable-message-reformatting"><meta name="viewport" content="width=device-width, initial-scale=1"><title>[[subjectfield_placeholder]]</title><style> img { -ms-interpolation-mode: bicubic; } table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; } .mceStandardButton .mceStandardButton td, .mceStandardButton td a { mso-hide: all !important; } p, a, li, td, blockquote { mso-line-height-rule: exactly; } p, a, li, td, body, table, blockquote { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; } @media only screen and (max-width: 480px) { body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: none !important; } } .mcnPreviewText { display: none !important; } .bodyCell { margin: 0 auto; padding: 0; width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; } .ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } body { height: 100%; margin: 0; padding: 0; width: 100%; background: #ffffff; } p { margin: 0; padding: 0; } table { border-collapse: collapse; } td, p, a { word-break: break-word; } h1, h2, h3, h4, h5, h6 { display: block; margin: 0; padding: 0; } img, a img { border: 0; height: auto; outline: none; text-decoration: none; } a[href^="tel"], a[href^="sms"] { color: inherit; cursor: default; text-decoration: none; } li p { margin: 0 !important; } .ProseMirror a { pointer-events: none; } @media only screen and (max-width: 640px) { .mceClusterLayout td { padding: 4px !important; } } @media only screen and (max-width: 480px) { body { width: 100% !important; min-width: 100% !important; } body.mobile-native { -webkit-user-select: none; user-select: none; transition: transform 0.2s ease-in; transform-origin: top center; } body.mobile-native.selection-allowed a, body.mobile-native.selection-allowed .ProseMirror { user-select: auto; -webkit-user-select: auto; } colgroup { display: none; } img { height: auto !important; } .mceWidthContainer { max-width: 660px !important; } .mceColumn { display: block !important; width: 100% !important; } .mceColumn-forceSpan { display: table-cell !important; width: auto !important; } .mceColumn-forceSpan .mceButton a { min-width: 0 !important; } .mceBlockContainer { padding-right: 16px !important; padding-left: 16px !important; } .mceTextBlockContainer { padding-right: 16px !important; padding-left: 16px !important; } .mceBlockContainerE2E { padding-right: 0px; padding-left: 0px; } .mceSpacing-24 { padding-right: 16px !important; padding-left: 16px !important; } .mceImage, .mceLogo { width: 100% !important; height: auto !important; } .mceFooterSection .mceText, .mceFooterSection .mceText p { font-size: 16px !important; line-height: 135% !important; } } div[contenteditable="true"] { outline: 0; } .ProseMirror h1.empty-node:only-child::before, .ProseMirror h2.empty-node:only-child::before, .ProseMirror h3.empty-node:only-child::before, .ProseMirror h4.empty-node:only-child::before { content: 'Heading'; } .ProseMirror p.empty-node:only-child::before, .ProseMirror:empty::before { content: 'Start typing...'; } .mceImageBorder { display: inline-block; } .mceImageBorder img { border: 0 !important; } body, #bodyTable { background-color: rgb(244, 244, 244); } .mceText, .mcnTextContent, .mceLabel { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; } .mceText, .mcnTextContent, .mceLabel { color: rgb(0, 0, 0); } .mceText h1 { margin-bottom: 0px; } .mceText h2 { margin-bottom: 0px; } .mceText p { margin-bottom: 0px; } .mceText ol { margin-bottom: 0px; } .mceText label { margin-bottom: 0px; } .mceText input { margin-bottom: 0px; } .mceSpacing-24 .mceInput+.mceErrorMessage { margin-top: -12px; } .mceText h1 { margin-bottom: 0px; } .mceText h2 { margin-bottom: 0px; } .mceText p { margin-bottom: 0px; } .mceText ol { margin-bottom: 0px; } .mceText label { margin-bottom: 0px; } .mceText input { margin-bottom: 0px; } .mceSpacing-12 .mceInput+.mceErrorMessage { margin-top: -6px; } .mceInput { background-color: transparent; border: 2px solid rgb(208, 208, 208); width: 60%; color: rgb(77, 77, 77); display: block; } .mceInput[type="radio"], .mceInput[type="checkbox"] { float: left; margin-right: 12px; display: inline; width: auto !important; } .mceLabel>.mceInput { margin-bottom: 0px; margin-top: 2px; } .mceLabel { display: block; }
  
            /* H\u00e4r b\u00f6rjar stilkod f\u00f6r text: dagligt nyhetsbrev */
            .mceText p,
            .mcnTextContent p {
                color: rgb(0, 0, 0);
                font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                font-size: 16px;
                font-weight: normal;
                line-height: 135% !important;
                text-align: left;
                direction: ltr;
            }
  
            .mceText h1,
            .mcnTextContent h1 {
                color: rgb(0, 0, 0);
                font-family: Georgia, Times, "Times New Roman", serif;
                font-size: 31px;
                font-weight: normal;
                line-height: 125%;
                text-align: left;
                direction: ltr;
            }
  
            .mceText h2,
            .mcnTextContent h2 {
                color: rgb(0, 0, 0);
                font-family: Georgia, Times, "Times New Roman", serif;
                font-size: 25px;
                font-weight: normal;
                line-height: 125%;
                text-align: left;
                direction: ltr;
            }
  
            .mceText a[href], .mcnTextContent a[href] {
                color: #000 !important;
               text-decoration: none !important;
               border-bottom: 2px solid #DEF41C !important;
               padding-bottom: 1px !important;
            }

  
            /* H\u00e4r b\u00f6rjar stilkod f\u00f6r text p\u00e5 mindre sk\u00e4rmar: dagligt nyhetsbrev */

            @media only screen and (max-width: 480px) {
                .mceText p {
                    margin: 0px;
                    font-size: 16px !important;
                    line-height: 135% !important;
                }
            }
  
            @media only screen and (max-width: 480px) {
                .mceText h1 {
                    font-size: 31px !important;
                    line-height: 125% !important;
                }
            }
  
            @media only screen and (max-width: 480px) {
                .mceText h2 {
                    font-size: 25px !important;
                    line-height: 125% !important;
                }
            }

            /* H\u00e4r slutar stilkod f\u00f6r text p\u00e5: dagligt nyhetsbrev */
  
            @media only screen and (max-width: 480px) {
                .mceBlockContainer {
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }
            }
  
            @media only screen and (max-width: 480px) {
                .mceDividerBlock {
                    border-top-width: 2px !important;
                }
  
                .mceDividerContainer {
                    width: 100% !important;
                }
            }
  
            #dataBlockId-9 p, #dataBlockId-9 h1, #dataBlockId-9 h2, #dataBlockId-9 h3, #dataBlockId-9 h4, #dataBlockId-9 ul { text-align: center; } #dataBlockId-43 p, #dataBlockId-43 h1, #dataBlockId-43 h2, #dataBlockId-43 h3, #dataBlockId-43 h4, #dataBlockId-43 ul { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; }

            /* Funding table responsive */
            .funding-desktop { display: table; width: 100%; }
            .funding-mobile  { display: none;  width: 100%; }
            @media only screen and (max-width: 480px) {
              .funding-desktop { display: none !important; max-height: 0 !important; overflow: hidden !important; }
              .funding-mobile  { display: table !important; max-height: none !important; }
            }
        </style>
    </head><body><!----><!--[if !gte mso 9]><!----><span class="mcnPreviewText" style="display:none; font-size:0px; line-height:0px max-height:0px; max-width:0px; opacity:0; overflow:hidden; visibility:hidden; mso-hide:all;">[[previewtext_placeholder]]</span><!--<![endif]--><!----><center><table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="background-color: rg (244, 244, 244);"><tbody><tr><td class="bodyCell" align="center" valign="top"><table id="root" border="0" cellpadding="0" cellspacing="0" width="100%"><tbody data-block-id="13" class="mceWrapper"><tr><td align="center" valign="top" class="mceWrapperOuter"><!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="660" style="width:660px;"><tr><td><![endif]--><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px" role="presentation"><tbody><tr><td style="background-color:#ffffff;background-position:center; background-repeat:no-repeat;background-size:cover" class="mceWrapperInner" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="12"><tbody><tr class="mceRow"><td style="background-position:center; background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="-15" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="background-color:#d0c4de;padding-top:12px; padding-bottom:12px;padding-right:48px;padding-left:48px" class="mceBlockContainer" align="left" valign="top"><a href="http://www.impactloop.se" style="display:block" target="_blank" data-block-id="2"><span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0"><img width="103" height="auto" style="width:103px;height:auto;max-width:103px !important;border-radius:0;display:block" alt="Logo" src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/58bd14de-b4e1-9d00-d5c3-000ff044d786.png" class="mceLogo"></span></a></td> </tr>
    
    [[sponsor_placeholder]]
                                        
    <tr><td class="mceGutterContainer" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate" role="presentation"><tbody><tr><td style="padding-top:12px;padding-bottom:0;padding-right:0;padding-left:0" class="mceLayoutContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="72" id="section_86147aca4c30800c06ef920ac2ecc474" class="mceLayout"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-16" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td align="center" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-8"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-20" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="77"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover;padding-top:0px; padding-bottom:0px" valign="top"><table border="0" cellpadding="0" cellspacing="24" width="100%" style="table-layout:fixed" role="presentation"> <colgroup> <col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"><col span="1" width="8.333333333333332%"></colgroup><tbody><tr><td style="padding-top:0; padding-bottom:0" class="mceColumn" data-block-id="74" valign="top" colspan="9" width="75%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"><table width="100%" style="border:0;border-radius:0;border-collapse:separate"><tbody><tr><td style="padding-left:24px;padding-right:16px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">

      <!-- Introduktion, table of contents och editor -->

      <div data-block-id="43" class="mceText" id="dataBlockId-43" style="width:100%">
        <p>[[intro_placeholder]]</p>
        <p><br></p>
        <p><strong>In today's newsletter:</strong></p>
        [[tableofcontents_placeholder]]
        <p><br></p>
        <p><strong>[[editor_placeholder]]</strong></p>
        <p class="last-child">
          <a href="mailto:[[editoremail_placeholder]]?subject=&body=" target="_blank">
            <strong>[[editoremail_placeholder]]</strong>
          </a>
        </p>
        <p style="margin-top:28px; font-family:'Courier New', Courier, monospace; font-size:14px;">\ud83d\udce9 Did someone forward this newsletter to you? <a href="https://www.impactloop.com/newsletter" style="color:#000000; text-decoration:underline;">Sign up here!</a></p>
      </div>
      
    </td></tr></tbody></table></td></tr></tbody></table></td><td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="76" valign="top" colspan="3" width="25%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td style="padding-top:12px;padding-bottom:0;padding-right:40px;padding-left:0" class="mceBlockContainer" align="center" valign="top"><span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0">
    
    <img data-block-id="44" width="125" height="auto" style="width:125px;height:auto;max-width:150px !important;border-radius:0;display:block" alt=""                                                               
      src="[[editorimage_placeholder]]"                                                            
    role="presentation" class="imageDropZone mceImage">
    
    </span>
    </td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td> </tr></tbody></table></td></tr> </tbody></table></td></tr> </tbody> </table></td></tr> </tbody></table></tr> </tbody></table></td> </tr> </tbody></table></td></tr><tr> <td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="52"> <tbody> <tr> <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"> </td> </tr> </tbody> </table>  </td> </tr> 

    <!-- End of introduction, table of contents and editor section -->

  <!-- Article 1 section -->

  <tr> <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table width="100%" style="border:0;border-radius:0;border-collapse:separate"> <tbody> <tr> <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
        <div data-block-id="629" class="mceText" id="dataBlockId-629" style="width:100%">
          <p class="last-child">
            <span style="color:#d0c4de;text-transform:uppercase;">
              [[category1_placeholder]]
            </span>
          </p>
        </div>
  </td> </tr> </tbody> </table> </td> </tr>
  
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="686" class="mceText" id="dataBlockId-686" style="width:100%">
                <h1 class="last-child">
                  [[headline1_placeholder]]
                </h1>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  
  <tr>
    <td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0" class="mceBlockContainer" align="left" valign="top">
      <a href="[[readinglink1_placeholder]]" style="display:block" target="_blank" data-block-id="699">
        <span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0">
          <img width="660" height="auto" style="width:660px;height:auto;max-width:1800px !important;border-radius:0;display:block" alt="" src="[[articleimage1_placeholder]]" role="presentation" class="imageDropZone mceImage">
        </span>
      </a>
    </td>
  </tr>

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="700" class="mceText" id="dataBlockId-700" style="width:100%">
                <p style="text-align: right;" class="last-child">
                  <em><span style="font-size: 14px">
                    [[imagetext1_placeholder]]
                  </span></em>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="701" class="mceText" id="dataBlockId-701" style="width:100%">
                <p><strong>[[ingress1_placeholder]]</strong></p><br>
                <p class="last-child">
                  <a href="[[readinglink1_placeholder]]" target="_blank">
                    <strong>Read the article here &ndash;&ndash;&ndash;&gt;</strong>
                  </a>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  [[related1_placeholder]]

  <!-- End of Article 1 section -->

  [[subscriptionmessage_placeholder]]

  <!-- Article 2 section -->

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="747" class="mceText" id="dataBlockId-747" style="width:100%">
                <p class="last-child">
                  <span style="color:#d0c4de;text-transform:uppercase;">
                    [[category2_placeholder]]
                  </span>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="748" class="mceText" id="dataBlockId-748" style="width:100%">
                <h1 class="last-child">
                  [[headline2_placeholder]]
                </h1>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  
  <tr>
    <td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0"  class="mceBlockContainer" align="left" valign="top">
      <a href="[[readinglink2_placeholder]]" style="display:block" target="_blank" data-block-id="749">
        <span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0">
          <img width="660" height="auto" style="width:660px;height:auto;max-width:900px !important;border-radius:0;display:block" alt="" src="[[articleimage2_placeholder]]" role="presentation" class="imageDropZone mceImage">
        </span>
      </a>
    </td>
  </tr>

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="750" class="mceText" id="dataBlockId-750" style="width:100%">
                <p style="text-align: right;" class="last-child">
                  <em><span style="font-size: 14px">[[imagetext2_placeholder]]</span></em>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="751" class="mceText" id="dataBlockId-751" style="width:100%">
                <p>
                  <strong>[[ingress2_placeholder]]</strong>
                </p><br>
                <p class="last-child">
                  <a href="[[readinglink2_placeholder]]" target="_blank">
                    <strong>Read the article here &ndash;&ndash;&ndash;&gt;</strong>
                  </a>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  [[related2_placeholder]]

  <!-- End of Article 2 section -->
                                          
  [[teknik_placeholder]]

  [[article3_placeholder]]  
  
  <tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="752">  <tbody> <tr> <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"></td> </tr> </tbody> </table> </td> </tr>

  <!-- Impact Svepet section -->   

  [[impactsvepet_placeholder]]

  <!-- End of Impact Svepet section -->   

  <!-- Meetups/Community section removed for Impact Loop VC -->
  
  <tr><td class="mceGutterContainer" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate" role="presentation"><tbody><tr><td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0" class="mceLayoutContainer" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0"  width="100%" role="presentation" data-block-id="504" id="section_bf47f1c4f80bb9c88da84db97371bdc2" class="mceLayout"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-17" valign="top" colspan="12" width="100%"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td align="center" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"  data-block-id="-10"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tbody><tr><td class="mceColumn" data-block-id="-21" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"  data-block-id="509"> <tbody> <tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="24" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="508" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr>  <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table width="100%" style="border:0;border-radius:0;border-collapse:separate"> <tbody> <tr> <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"> <div data-block-id="722" class="mceText" id="dataBlockId-722" style="width:100%"> <p class="last-child">  </p> </div> </td> </tr> </tbody> </table> </td> </tr>
  
  <!-- Kapitalrundor section -->   

  [[fundingrounds_placeholder]]

  <!-- End of Kapitalrundor section -->   
  
  <tr><td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="766"> <tbody> <tr> <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"> </td></tr></tbody></table> </td> </tr> </tbody>  </table> </td> </tr></tbody></table> </td></tr></tbody></table></td></tr> </tbody></table></td> </tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr>
  
  <tr><td class="mceGutterContainer" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:12px;padding-right:0;padding-left:0" class="mceLayoutContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="759" id="section_76e65b84c6f835eeb8af7bdd51c42a1f"  class="mceLayout"> <tbody> <tr class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td class="mceColumn" data-block-id="-19" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td align="center" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-14"> <tbody> <tr class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td class="mceColumn" data-block-id="-23" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="762"> <tbody> <tr class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="24" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="761" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table width="100%" style="border:0;border-radius:0;border-collapse:separate"> <tbody><tr> <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"> <div data-block-id="778" class="mceText" id="dataBlockId-778" style="width:100%"> <p class="last-child"> <span style="color:#d0c4de;">TOPPLISTAN</span> </p> </div> </td> </tr> </tbody> </table> </td></tr>
  
  <!-- Mest l\u00e4st i veckan / Most Read section -->   

  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody> 
          <tr> 
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:6px" class="mceTextBlockContainer"> 
              <div data-block-id="763" class="mceText" id="dataBlockId-763" style="width:100%"> 
                <h2 class="last-child">Most read on Impact Loop</h2>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="765" class="mceText" id="dataBlockId-765" style="width:100%">
                [[mostread_placeholder]]
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <!-- End of Mest l\u00e4st i veckan / Most Read section -->   

  <tr> <td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer" data-block-id="775"> <tbody> <tr> <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> 

  <!-- PS Om du missat artikel section -->   
  <tr><td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table width="100%" style="border:0;border-radius:0;border-collapse:separate"> <tbody> <tr> <td style="padding-left:24px;padding-right:24px;padding-top:0;padding-bottom:12px" class="mceTextBlockContainer"> 

    <div data-block-id="777" class="mceText" id="dataBlockId-777" style="width:100%"> 
      <p class="last-child">
        <span style="color:#d0c4de;">MORE NEWS ON IMPACT LOOP</span>
      </p>
    </div>

  </td> </tr> </tbody> </table> </td> </tr>
  <tr> <td class="mceGutterContainer" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:12px;padding-right:0;padding-left:0" class="mceLayoutContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="753" id="section_c87e7165a213884906b12133b5caaa43" class="mceLayout"> <tbody> <tr class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td class="mceColumn" data-block-id="-18" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td align="center" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-12"> <tbody> <tr class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover" valign="top"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td class="mceColumn" data-block-id="-22" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="758"> <tbody> <tr  class="mceRow"> <td style="background-position:center;background-repeat:no-repeat;background-size:cover;padding-top:0px;padding-bottom:0px" valign="top"> <table border="0" cellpadding="0" cellspacing="24"  width="100%" style="table-layout:fixed" role="presentation"> <colgroup> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1"  width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1"  width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> <col span="1" width="8.333333333333332%"> </colgroup> 
  <tbody><tr> <td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="755" valign="top" colspan="4" width="33.33333333333333%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody><tr> 
  <td style="padding-top:12px;padding-bottom:12px;padding-right:0;padding-left:0" class="mceBlockContainer" align="center" valign="top">

    <a href="[[psarticlelink_placeholder]]" style="display:block" target="_blank" data-block-id="774">
      <span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0">
        <img width="187.00000000000003" height="auto" style="width:187.00000000000003px;height:auto;max-width:220px !important;border-radius:0;display:block" alt="" src="[[psarticleimage_placeholder]]" role="presentation" class="imageDropZone mceImage">
      </span>
    </a>
    
  </td></tr></tbody></table></td><td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="757" valign="top" colspan="8" width="66.66666666666666%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table width="100%" style="border:0;border-radius:0;border-collapse:separate"> <tbody> <tr> <td style="padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer"> 

    <div data-block-id="776" class="mceText" id="dataBlockId-776" style="width:100%">
      <p class="last-child">
        <a href="[[psarticlelink_placeholder]]" target="_blank">
          <strong>
            [[psarticletitle_placeholder]]
          </strong>
        </a>
      </p>
    </div>

  <!-- Om Impact Loop section -->   

  </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td>  </tr> </tbody> </table> </td> </tr> <tr> <td style="background-color:transparent;padding-top:20px;padding-bottom:20px;padding-right:24px;padding-left:24px" class="mceBlockContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent;width:100%" role="presentation" class="mceDividerContainer"  data-block-id="522"> <tbody> <tr> <td style="min-width:100%;border-top-width:1px;border-top-style:solid;border-top-color:#e5e6d2" class="mceDividerBlock" valign="top"> </td> </tr> </tbody> </table> </td> </tr> <tr> <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" valign="top"> <table  width="100%" style="border:0;background-color:#EAEAEA;border-radius:0;border-collapse:separate"> <tbody> <tr> <td style="padding-left:24px;padding-right:24px;padding-top:28px;padding-bottom:28px" class="mceTextBlockContainer"> 

    <div data-block-id="188" class="mceText" id="dataBlockId-188" style="width:100%">
      <h1>
        Join Europe's leading impact investors
      </h1>
      <p>
        <br>Impact Loop is your go-to business news platform for investors (and founders) in the European impact space.
      </p>
      <p><br></p>
      <p>
        \ud83d\udc49 <a href="https://www.impactloop.com/subscribe" target="_blank"><strong>Subscribe to our paid plan</strong></a> to get unlimited access to all of our journalism.
      </p>
      <p><br></p>
      <p class="last-child">
        Got a news tip or want to get to know us more? <a href="mailto:sion@loop.se" target="_blank"><strong>Contact us here!</strong></a>
      </p>
    </div>

  </td></tr> </tbody> </table> </td> </tr> <tr> <td style="background-color:#d0c4de;padding-top:32px;padding-bottom:12px;padding-right:0;padding-left:0" class="mceLayoutContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="7"> <tbody> <tr class="mceRow"> <td style="background-color:#d0c4de;background-position:center;background-repeat:no-repeat;background-size:cover;padding-top:0px;padding-bottom:0px" valign="top"> <table border="0" cellpadding="0" cellspacing="24" width="100%" role="presentation"> <tbody> <tr> <td class="mceColumn" data-block-id="-6" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td valign="top"> <span><!--[if mso]> </tr> </table> <![endif]--></span> <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" class="mceSocialFollowContainer" data-block-id="-5" style=" mso-table-lspace: 0; mso-table-rspace: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; "> <tbody> <tr> <td align="center" valign="middle"> <span> <!--[if mso]> <table align="left" border="0" cellspacing= "0" cellpadding="0"> <tr> <![endif]--> </span><span> <!--[if mso]> <td align="center" valign="top"> <![endif]--> </span> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline" role="presentation" float="left"> <tbody> <tr> <td style="padding-top:3px;padding-bottom:3px;padding-left:12px;padding-right:12px" align="center" width="24" valign="top">
    
    <a href="https://www.facebook.com/impactloop.se/" target="_blank" rel="noreferrer"><img class="mceSocialIcon" width="24" height="24" alt="Facebook icon" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/facebook-filled-dark-40.png"></a>
    
  </td></tr></tbody></table> <span><!--[if mso]> </td> <![endif]--> </span><span>  <!--[if mso]> <td align="center" valign="top"> <![endif]--> </span> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline" role="presentation" float="left"> <tbody> <tr> <td style="padding-top:3px;padding-bottom:3px;padding-left:12px;padding-right:12px" align="center" width="24" valign="top">

    <a href="https://www.instagram.com/impactloop.se/" target="_blank" rel="noreferrer"><img class="mceSocialIcon" width="24" height="24" alt="Instagram icon" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/instagram-filled-dark-40.png"></a>
    
  </td> </tr> </tbody> </table> <span> <!--[if mso]> </td> <![endif]--> </span><span> <!--[if mso]> <td align="center" valign="top"><![endif]--></span> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline" role="presentation" float="left"> <tbody> <tr> <td style="padding-top:3px;padding-bottom:3px;padding-left:12px;padding-right:12px" align="center" width="24" valign="top">
  
    <a href="https://se.linkedin.com/company/impact-loop-loop" target="_blank" rel="noreferrer"><img class="mceSocialIcon" width="24" height="24" alt="LinkedIn icon" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/linkedin-filled-dark-40.png"></a>
    
  </td> </tr> </tbody> </table> <span> <!--[if mso]> </td> <![endif]--></span><span><!--[if mso]> <td align="center" valign="top"><![endif]--></span> <table align="left" border="0" cellpadding="0" cellspacing="0" style="display:inline" role="presentation" float="left"> <tbody> <tr> <td style="padding-top:3px;padding-bottom:3px;padding-left:12px;padding-right:12px" align="center" width="24" valign="top">
    
    <a href="https://www.threads.net/@impactloop.se" target="_blank" rel="noreferrer"><img class="mceSocialIcon" width="24" height="24" alt="Threads icon" src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/threads-filled-dark-40.png"></a>
  
  </td> </tr> </tbody> </table> <span><!--[if mso]> </td> <![endif]--></span> </td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr> <td style="background-color:#d0c4de;padding-top:8px;padding-bottom:8px;padding-right:8px;padding-left:8px" class="mceLayoutContainer" valign="top"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="11" id="section_dd34c40720d6b020685a9da73e122d16" class="mceFooterSection"> <tbody> <tr class="mceRow"> <td style="background-color:#d0c4de;background-position:center;background-repeat:no-repeat;background-size:cover;padding-top:0px;padding-bottom:0px" valign="top"> <table border="0" cellpadding="0" cellspacing="12" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:0;padding-bottom:0" class="mceColumn" data-block-id="-3" valign="top" colspan="12" width="100%"> <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"> <tbody> <tr> <td style="padding-top:12px;padding-bottom:12px;padding-right:48px;padding-left:48px" class="mceBlockContainer" align="center" valign="top"> <span class="mceImageBorder" style="border:0;border-radius:0;vertical-align:top;margin:0"><img data-block-id="8" width="97" height="auto" style="width:97px;height:auto;max-width:97px !important;border-radius:0;display:block" alt="Logo" src="https://mcusercontent.com/46f8b3dcdd581118cad2f80ee/images/58bd14de-b4e1-9d00-d5c3-000ff044d786.png" class="mceLogo"></span></td> </tr>
  
  <!-- End of Om Impact Loop section -->   

  <!-- Footer (uppdatera preferenser) section -->  
  <tr>
    <td style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0" align="center" valign="top">
      <table width="100%" style="border:0;border-radius:0;border-collapse:separate">
        <tbody>
          <tr>
            <td style="padding-left:16px;padding-right:16px;padding-top:12px;padding-bottom:12px" class="mceTextBlockContainer">
              <div data-block-id="9" class="mceText"id="dataBlockId-9" style="display:inline-block;width:100%">
                <p class="last-child">
                  <em><span style="font-size: 12px">Copyright (C) Impact Loop 2025. All rights reserved.</span></em><br><br>

                  <span style="font-size: 12px">You are receiving this email because you subscribed to Impact Loop's newsletter, or your professional role has been identified as relevant to our independent journalistic content. We process your contact details based on legitimate interest and strictly for professional outreach purposes.</span><br><br>

                  <span style="font-size: 12px">You can </span>

                  <a href="https://impactloop.mailchimpsites.com/manage/preferences?u=46f8b3dcdd581118cad2f80ee&id=2575eb3724&e=[UNIQID]&c=fe99aba8f5"><span style="font-size: 12px">update your preferences</span></a>

                  <span style="font-size: 12px"> or </span>

                  <a href="https://impactloop.us21.list-manage.com/unsubscribe?u=46f8b3dcdd581118cad2f80ee&id=2575eb3724&t=b&e=[UNIQID]&c=fe99aba8f5"><span style="font-size: 12px">unsubscribe</span></a>

                  <span style="font-size: 12px"> completely whenever you like.</span>
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  
  <!-- End of Footer section  -->  

  <tr><td class="mceLayoutContainer" align="center" valign="top"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" data-block-id="-2"><tbody><tr class="mceRow"><td style="background-position:center;background-repeat:no-repeat;background-size:cover;padding-top:0px;padding-bottom:0px" valign="top"><table border="0" cellpadding="0" cellspacing="24" width="100%" role="presentation"><tbody></tbody></table></td></tr></tbody></table></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]--></td></tr></tbody></table></td></tr></tbody></table></center></body>
  </html>`;

/**
 * Ersätter alla [[placeholder_name]] i HTML-mallen med givna värden.
 * Okända platshållare lämnas tomma (ersätts med tom sträng).
 */
export function generateNewsletterHTML(
  placeholders: Record<string, string>
): string {
  let html = NEWSLETTER_HTML_TEMPLATE;
  for (const [key, value] of Object.entries(placeholders)) {
    // key kan vara med eller utan [[ ]] – normalisera
    const normalizedKey = key.startsWith('[[') ? key : `[[${key}]]`;
    html = html.split(normalizedKey).join(value ?? '');
  }
  // Ta bort eventuella kvarvarande platshållare
  html = html.replace(/\[\[[a-z0-9_]+\]\]/g, '');
  return html;
}
