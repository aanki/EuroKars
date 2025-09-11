/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/render', 'N/file'], function(serverWidget, render, file) {
    
    function onRequest(context) {
        if (context.request.method === 'GET') {
            // Create form
            var form = serverWidget.createForm({
                title: 'Rolls-Royce Test Drive Form Generator'
            });
            
            var testDriveTemplate = `
                <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
                <pdf>
                    <head>
                        <style type="text/css">
                            body { font-family: Arial, sans-serif; font-size: 10pt; }
                            .title { font-size: 16pt; font-weight: bold; text-align: center; margin: 20px 0 30px 0; }
                            .main-text { text-align: justify; margin-bottom: 20px; }
                            .indemnity-text { text-align: justify; margin-bottom: 30px; }
                            .section-title { font-size: 12pt; font-weight: bold; margin: 0 0 15px 0; }
                            .field-row { margin-bottom: 10px; }
                            .field-row-spacing { margin-bottom: 15px; }
                            .separator { text-align: center; margin: 20px 0; }
                            .signature-section { margin-top: 30px; }
                            .footer { margin-top: 20px; font-size: 8pt; }
                            .consent-text { font-size: 10pt; text-align: justify; margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="title">Rolls-Royce Test Drive Request Form</div>
                        
                        <div class="main-text">
                            I, <u>______________________________________</u> (Full Name), <u>________________</u> (NRIC No last 4 digits.), hereby request for a test-drive in a Rolls-Royce Phantom / Ghost / Cullinan / Spectre and declare that I am in possession of a valid Class 3 driving license. I undertake to drive the above-mentioned vehicle in a safe manner, and in accordance with the Rules and Regulations of the "Traffic Police of Singapore".
                        </div>
                        
                        <div class="indemnity-text">
                            I will indemnify Rolls-Royce Motor Cars Singapore (Trans Eurokars Pte Ltd) (including its officers, employees, and directors) against any liabilities, claims, losses, damages, costs and expenses arising from or in connection with the test drive, including but not limited to the liability to pay insurance excess of $20,000 or deductible in the event of an accident involving the vehicle(s) howsoever arising.
                        </div>
                        
                        <div class="section-title">Customer's Particulars:</div>
                        
                        <div class="field-row">Address:   _________________________________________________________________</div>
                        <div class="field-row-spacing">           _________________________________________________________________</div>
                        
                        <table width="100%">
                            <tr>
                                <td width="50%">Contact No: ______________________</td>
                                <td width="50%">Date of birth: _______________________________</td>
                            </tr>
                        </table>
                        <br/>
                        
                        <table width="100%">
                            <tr>
                                <td width="50%">Email: ___________________________</td>
                                <td width="50%">Driving License No: __________________________</td>
                            </tr>
                        </table>
                        <br/><br/>
                        
                        <div class="section-title">Customer's Current Car Information:</div>
                        
                        <table width="100%">
                            <tr>
                                <td width="70%">Make / Model: ______________________________________</td>
                                <td width="30%">Reg. No.: ____________________</td>
                            </tr>
                        </table>
                        <br/><br/>
                        
                        <div class="section-title">Preferred Modes of Communication:</div>
                        
                        <div class="field-row">☐ Email   ☐ Voice Call   ☐ SMS / other phone-based messaging   ☐ Direct Mailer</div>
                        <div class="field-row">☐ All of the above</div>
                        
                        <br/><br/><br/>
                        
                        <div style="page-break-before: always;"></div>
                        
                        <div class="consent-text">
                            By signing hereunder, I confirm that I have read, understood and consent the collection, use, disclosure and processing of my personal data by Rolls-Royce Motor Cars Singapore (Trans Eurokars Pte Ltd) and its related corporations and affiliates (collectively, the "Eurokars Group") and their authorised service providers and relevant third parties, in accordance with purposes set out in the Eurokars Group Data Protection Policy available at www.eurokars.com.sg or made available to me upon request, as may be reasonably required to provide me with the products and/or services.
                        </div>
                        
                        <div class="consent-text">
                            In addition, I hereby request for and consent to the collection, use or disclosure of my personal data by Rolls-Royce Motor Cars Singapore (Trans Eurokars Pte Ltd) and its related corporations and affiliates (collectively, the "Eurokars Group"), and its agents and the Eurokars Group sharing such personal data with Eurokars Group's business partners and marketing partners as well as their authorised service providers for the purposes of contacting me and sending me marketing and promotional material about products and services, benefits, promotions and rewards or to identify other products or services which may be relevant to me, via the modes selected above and using my contact particulars which Rolls-Royce Motor Cars Singapore may have in its records from time to time (including where applicable my Singapore telephone number(s)).
                        </div>
                        
                        <div class="separator">================================================================</div>
                        
                        <table width="100%">
                            <tr>
                                <td width="50%">Date:        ______________________</td>
                                <td width="50%"></td>
                            </tr>
                        </table>
                        <br/>
                        
                        <div class="field-row">Start Mileage: ______________________</div>
                        <div class="field-row">End Mileage:  ______________________</div>
                        
                        <table width="100%">
                            <tr>
                                <td width="50%">Time out:     ______________________</td>
                                <td width="50%"></td>
                            </tr>
                        </table>
                        <br/>
                        
                        <table width="100%">
                            <tr>
                                <td width="50%">Time return: ______________________</td>
                                <td width="50%">Sales Consultant: _________________</td>
                            </tr>
                        </table>
                        <br/><br/><br/>
                        
                        <div class="signature-section">
                            <table width="100%">
                                <tr>
                                    <td width="50%" style="text-align: center;">
                                        _______________________________<br/>
                                        Customer Signature
                                    </td>
                                    <td width="50%" style="text-align: center;">
                                        _______________________________<br/>
                                        Sales Consultant's Signature
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="footer">
                            Last update: 17 April 2024
                        </div>
                    </body>
                </pdf>
            `;
            
            var renderer = render.create();
            renderer.templateContent = testDriveTemplate;
            
            var pdfFile = renderer.renderAsPdf();
            
            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });
            
        } else {
            // Generate PDF
           
        }
    }
    
    return {
        onRequest: onRequest
    };
});