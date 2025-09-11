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
                title: 'Rolls-Royce Waiver Form Generator'
            });
            
            var waiverTemplate = `
                <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
                <pdf>
                    <head>
                        <style type="text/css">
                            body { font-family: Arial, sans-serif; font-size: 10pt; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .title { font-size: 12pt; font-weight: bold; text-decoration: underline; margin-bottom: 15px; }
                            .notice { text-align: justify; margin-bottom: 15px; }
                            .terms { margin-bottom: 20px; }
                            .terms ol { padding-left: 20px; }
                            .terms li { margin-bottom: 10px; text-align: justify; }
                            .personal-details { margin-bottom: 20px; }
                            .field-row { margin-bottom: 8px; }
                            .signature-section { margin-top: 30px; }
                            .consent-section { margin-top: 20px; font-size: 9pt; text-align: justify; }
                            .footer { margin-top: 40px; text-align: center; font-weight: bold; }
                            .page-number { text-align: right; font-size: 8pt; }
                        </style>
                    </head>
                    <body>
                        <div class="page-number">Page 1 of 1</div>
                        
                        <table width="100%">
    <tr>
        <td align="center" style="font-size:24pt; font-weight:bold; padding:20px 0 30px 0;">RR</td>
    </tr>
</table>

<p>Date: .............................</p>

<p style="font-size:12pt; font-weight:bold; text-decoration:underline; margin-bottom:15px;">
    Release and Waiver of Liability and Indemnity Agreement
</p>

<p style="text-align:justify; margin-bottom:15px;">
    FOR PERMISSION TO BE CHAUFFEURED IN A ROLLS-ROYCE MOTOR VEHICLE ("Vehicle") PLEASE READ THE FOLLOWING NOTICE AND SIGN AND DATE WHERE INDICATED BELOW TO CONFIRM YOUR AGREEMENT TO AND UNDERSTANDING OF THE CONDITIONS SET OUT BELOW:
</p>

                        
                        <div class="terms">
                            <ol>
                                <li>Except in respect of liability for death or personal injury caused by the negligence of Rolls-Royce Motor Cars Limited or Rolls-Royce Motor Cars Singapore or its employees or agents/dealers, Rolls-Royce Motor Cars Limited or Rolls-Royce Motor Cars Singapore or its employees or agents/dealers will not be liable for any other loss or damage (including consequential loss) howsoever caused.</li>
                                
                                <li>You accept that smoking is not permitted in the Vehicle.</li>
                                
                                <li>You understand that Rolls-Royce Motor Cars Singapore or Rolls-Royce Motor Cars Limited reserves the right to remove you from the Vehicle, if it considers your actions to be dangerous or detrimental to other parties.</li>
                                
                                <li>The above shall be governed by and construed in accordance with the local laws of the country, province or state where the test drive has taken place and subject to the exclusive jurisdiction of the that country, province or state.</li>
                            </ol>
                        </div>
                        
                      <table width="100%" style="margin-top:20px; font-size:10pt;">
    <tr>
        <td colspan="2" style="font-weight:bold; padding-bottom:10px;">
            PERSONAL DETAILS (Please complete in full):
        </td>
    </tr>
    <tr>
        <td colspan="2">Surname .......................................... First Name(s) ......................................</td>
    </tr>
    <tr>
        <td colspan="2">NRIC / Driving License No. ..............................................................................</td>
    </tr>
    <tr>
        <td colspan="2">Company / Organisation .................................................................................</td>
    </tr>
    <tr>
        <td colspan="2">Home Address ........................................................................................</td>
    </tr>
    <tr>
        <td colspan="2">...................................................................................................................</td>
    </tr>
    <tr>
        <td>Telephone No. ........................................</td>
        <td>Email ..........................................</td>
    </tr>
    <tr>
        <td colspan="2">Mobile ..........................................................................................................</td>
    </tr>
</table>

<p style="margin-top:20px; text-align:justify;">
    I fully understand and hereby agree that I have received comprehensive driving instructions and accept the above conditions.
</p>

                        
                        <div class="signature-section">
                            <table width="100%">
                                <tr>
                                    <td width="50%">Signature ............................................................</td>
                                    <td width="50%">Date .............................</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="consent-section">
                            <span style="font-size: 14pt;">☐</span> I confirm that by providing my personal data and contact details as above, I have agreed to receive from Rolls-Royce Motor Cars Singapore (Trans Eurokars Pte Ltd) and or its authorised agents/employees messages (in sound, text, visual and other form) including via the above Singapore telephone number, to offer to supply, provide, advertise, promote services in connection with Rolls-Royce Motor Cars Singapore businesses, in accordance with the Personal Data Protection Act, until such time I inform Rolls-Royce Motor Cars Singapore in writing, otherwise.
                        </div>
                        
                      <table width="100%" style="margin-top:30px;">
    <tr>
        <td align="center">
            ROLLS-ROYCE<br/>
            MOTOR CARS<br/>
            ________________<br/>
            SINGAPORE
        </td>
    </tr>
</table>

                    </body>
                </pdf>
            `;
            
            var renderer = render.create();
            renderer.templateContent = waiverTemplate;
            
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