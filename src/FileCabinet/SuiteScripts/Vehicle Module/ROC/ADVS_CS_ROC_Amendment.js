/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

        function pageInit(scriptContext) {

            $(document).ready(function () {

                // Checking Suitlet Open from ROC custom record or from Sales Order
                var rocId = $('#custpage_roc_id').val();

                if (rocId) {
                    console.log('Parsed:', ROC_custom_record_data);
                    showSummary(ROC_custom_record_data.ROCchild, ROC_custom_record_data.RevisedNetSellingPriceAmount, ROC_custom_record_data.RevisedcolourName, ROC_custom_record_data.RevisedcolourAmount);
                } else {
                    showMain_section();
                }
            });

            $('.cancel-btn').on('click', function () {
                window.parent.closePopup();
                
            });
            $('.accept-btn').on('click', function () {
                try {

                    var ROCrecordId = $('#custpage_roc_id').val();
                    if (ROCrecordId) {
                        var signatureCust = $('#signature-data').val();
                        var signatureSales = $('#signature-data1').val();
                        if (!signatureCust || !signatureSales) {
                            showNotification('Please provide both customer and sales signatures before accepting.', 'warning');
                            return;
                        }

                        const $btn = $(this);
                        const originalText = $btn.text();
                        $btn.html('Submitting...').addClass('btn-spinner').prop('disabled', true);


                        var updatePayload = {
                            action: 'updateSignatures',
                            ROCrecordId: ROCrecordId,
                            custSignature: signatureCust,
                            salesSignature: signatureSales,
                        };
                        $.ajax({
                            url: window.location.href,
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(updatePayload),
                            dataType: 'json',
                            success: function (data) {
                                if (data.success) {
                                    showNotification('ROC has been created sucessfully.', 'success');
                                    $btn.removeClass('btn-spinner');
                                    setTimeout(function () {
                                        $btn.text(originalText).prop('disabled', false);
                                        window.parent.closePopup();
                                        if (window.parent && typeof window.parent.location.reload === 'function') {
                                            window.parent.location.reload();
                                        }
                                    }, 1000);

                                } else {
                                    showNotification('Error accepting ROC: ' + data.error, 'error');
                                    $btn.html('Accepted').removeClass('btn-spinner').prop('disabled', false);
                                }
                            },
                            error: function (xhr, status, error) {
                                alert('Error accepting ROC:', error);
                            }
                        });

                    }
                } catch (error) {
                    $btn.html('Accepted').removeClass('btn-spinner').prop('disabled', false);
                    console.error('Error in accept button click:', error);
                    alert('An error occurred while Apcepting. Please try again.' + error.message);
                }

            });
            $('.save-sign-btn').on('click', function () {
                submitRocForm(true);
            });
            $('.submit-btn').on('click', function () {

                submitRocForm(false);

            });
            // Auto-format currency inputs
            $(document).on('input', 'input[placeholder="$0.00"]', function () {
                let value = $(this).val().replace(/[^0-9.-]/g, '');

                const isNegative = value.startsWith('-');
                value = value.replace(/-/g, '');
                if (isNegative) {
                    value = '-' + value; // Re-add one dash at the front
                }
                if (value) {
                    const number = parseFloat(value);
                    if (!isNaN(number)) {
                        $(this).val('$' + number.toLocaleString());
                    } else {
                        $(this).val('');
                    }
                } else {
                    $(this).val('');
                }
                updateNetPrice();
            });
            $(document).on('input', '.roc-amount-input', function () {
                updateNetPrice();
            });

            // Add RoC Line Item functionality
            document.querySelector('.add-item-btn').addEventListener('click', function () {

                const tbody = document.getElementById('roc-items-tbody');
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
        <td class="revised-column">
            <select class="form-input form-select">
               ${optionsHtmlROC}
            </select>
        </td>
        <td class="revised-column">
            <input type="text" class="form-input" placeholder="Enter item name">
        </td>
        <td class="revised-column">
            <input type="text" class="form-input roc-amount-input" placeholder="$0.00">
        </td>
        <td class="revised-column" style="text-align: center;">
            <button type="button" class="remove-item-btn" style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
        </td>
    `;
                tbody.appendChild(newRow);
                // Attach input listener for price change
                newRow.querySelector('input[placeholder="$0.00"]').addEventListener('input', updateNetPrice);
            });

            // Delegated remove button functionality (works for all rows, new and existing)
            $(document).on('click', '.remove-item-btn', function () {
                $(this).closest('tr').remove();
                updateNetPrice();
            });

            function updateNetPrice() {
                let baseAttr = $('#netSellingPrice').attr('data-base');
                let basePrice = parseFloat(baseAttr?.toString().replace(/[^0-9.-]/g, '')) || 0;
                let totalAdjustment = 0;

                $('.roc-amount-input').each(function () {
                    const value = parseFloat($(this).val().replace(/[^0-9.-]/g, '')) || 0;
                    totalAdjustment += value;
                });

                const newPrice = basePrice + totalAdjustment;
                const formattedPrice = newPrice.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2
                });
                $('#netSellingPrice').val(formattedPrice);
            }

            setupSignature('signature-pad', 'signature-data');
            setupSignature('signature-pad1', 'signature-data1');

        }

        function setupSignature(canvasId, inputId) {
            const $canvas = $('#' + canvasId);
            const canvas = $canvas[0];
            const ctx = canvas.getContext('2d');
            let drawing = false;

            $canvas.on('mousedown', function (e) {
                drawing = true;
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            });

            $canvas.on('mousemove', function (e) {
                if (drawing) {
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.stroke();
                }
            });

            $canvas.on('mouseup mouseleave', function () {
                if (drawing) {
                    drawing = false;
                    $('#' + inputId).val(canvas.toDataURL());
                }
            });
        }

        // Convert typed name into canvas signature
        window.setTypeMode = function (canvasId, inputId) {
            const $canvas = $('#' + canvasId);
            const canvas = $canvas[0];
            const ctx = canvas.getContext('2d');
            $canvas.hide();

            const typedName = prompt("Type your name for the signature:");
            if (typedName) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = "20px Arial";
                ctx.fillText(typedName, 10, 50);
                $('#' + inputId).val(canvas.toDataURL());
                $canvas.show();
            }
        };

        // Clear canvas and input value
        window.clearSignature = function (canvasId, inputId) {
            const canvas = $('#' + canvasId)[0];
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            $('#' + inputId).val('');
        };

        // Show canvas
        window.setDrawMode = function (canvasId) {
            $('#' + canvasId).show();
        };

        // Save ROC deatil in Custom Record
        function submitRocForm(showSummaryTable = false) {
            const $btn = showSummaryTable ? $('.save-sign-btn') : $('.submit-btn');
            const originalText = $btn.text();
            $btn.html('Submitting...').addClass('btn-spinner').prop('disabled', true);

            var items = [];

            $('#roc-items-tbody tr').each(function () {
                var $row = $(this);
                var selectedItem = $row.find('select').val();
                var selecteditemName = $row.find('select option:selected').text(); // name (text)
                var itemName = $row.find('input[placeholder="Enter item name"]').val().trim();
                var amount = $row.find('input.roc-amount-input').val().trim();

                if (selectedItem || itemName || amount) {
                    items.push({
                        selectedItem: selectedItem,
                        itemName: itemName,
                        amount: amount,
                        selecteditemName: selecteditemName
                    });
                }
            });

            var payload = {
                transactionId: $('#custpage_transaction_id').val(),
                CurrentModelID: $('#custpage_current_model_id').val(),
                CurrentVariantID: $('#custpage_current_varian_id').val(),
                CurrentColourID: $('#custpage_current_colour_id').val(),
                RevisedColourID: $('#custpage_colour_select').val(),
                RevisedColourName: $('#custpage_colour_select').text().trim(),
                RevisedColourAmount: $('#custpage_color_amount').val(),
                BankPackage: $('#bankPackageSelect').val(),
                LoanAmount: $('#custpage_loanamnt_selected').val(),
                TermID: $('#custpage_term_select').val(),
                IntRate: $('#custpage_int_rate').val(),
                InsCompany: $('#custpage_insurance_company_selected').val(),
                InsPeriod: $('#custpage_insurance_period_selected').val(),
                obuTouch: $('#custpage_obu_touchscreen').text().trim(),
                obuLoc: $('#custpage_obu_loc_selected').text().trim(),
                RevisednetSellingPrice: $('#netSellingPrice').val(),
                Remarks: $('#remarks').val(),
                dynamicItems: items
            };

            $.ajax({
                url: window.location.href,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                dataType: 'json',
                success: function (data) {
                    if (data.success) {
                        //  $btn.html('ROC Saved Successfully!').removeClass('btn-spinner').css('background', '#48bb78');
                        $btn.removeClass('btn-spinner');
                        showNotification('ROC has been created sucessfully.', 'success');
                        if (showSummaryTable) {
                            $btn.text(originalText).prop('disabled', false);
                            const ROCsavedId = data.recordId;
                            console.log("Record saved with ID:", ROCsavedId);
                            $('#custpage_roc_id').val(ROCsavedId);

                            showSummary(items, payload.RevisednetSellingPrice, payload.ColourName, payload.ColourAmount);
                        } else {
                            setTimeout(function () {
                                $btn.text(originalText).prop('disabled', false);
                                window.parent.closePopup();
                                if (window.parent && typeof window.parent.location.reload === 'function') {
                                    window.parent.location.reload();
                                }
                            }, 1000);
                        }
                    } else {
                        $btn.text(originalText).prop('disabled', false);
                        showNotification('Error: ' + data.error, 'error');

                    }
                },
                error: function (xhr, status, error) {
                    alert('Error submitting form:', error);
                }
            });
        }
        function showSummary(items, netSellingPrice, ColourName, ColourAmount) {
            let rowsHtml = '';

            if (ColourName && ColourAmount) {
                rowsHtml += `
            <tr>
                <td>Change of Colour</td>
                <td>${ColourName}</td>
                <td class="amount">${ColourAmount}</td>
            </tr>`;
            }
            items.forEach(item => {
                rowsHtml += `
            <tr>
                <td>${item.selecteditemName || ''}</td>
                <td>${item.itemName || ''}</td>
                <td class="amount">${item.amount || ''}</td>
            </tr>`;
            });

            const errorHtml = `
        <table class="amendment-table">
            <thead>
                <tr>
                    <th>Change Type</th>
                    <th class="description">Description</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
                <tr class="total-row">
                    <td colspan="2"><strong>New Net Selling Price</strong></td>
                    <td class="amount"><strong>${netSellingPrice}</strong></td>
                </tr>
            </tbody>
        </table>`;

            $('#roc-tabel').html(errorHtml);
            showSignature_section();

        }
        function showSignature_section() {
            $('#roc-loader').hide();
            $('#fullcontainer').show();
            $('#main-roc-div').hide();
            $('#btnSign').hide();
            $('#btnSubmit').hide();
            $('#roc-signature-section').show();
            $('#btnAccept').show();
            $('#btnCancel').show();
        }
        function showMain_section() {
            $('#roc-loader').hide();
            $('#fullcontainer').show();
            $('#main-roc-div').show();
            $('#btnSign').show();
            $('#btnSubmit').show();
            $('#roc-signature-section').hide();
            $('#btnAccept').hide();
            $('#btnCancel').hide();
        }

        function showNotification(message, type = 'info') {
            // Remove any existing notifications
            const existingNotification = document.getElementById('notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10001;
        max-width: 400px;
        animation: notificationSlideIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
            // Set background color based on type
            const colors = {
                'success': '#27ae60',
                'error': '#e74c3c',
                'warning': '#f39c12',
                'info': '#3498db'
            };
            notification.style.backgroundColor = colors[type] || colors.info;
            notification.textContent = message;
            // Add animation styles if not exists
            if (!document.getElementById('notificationStyles')) {
                const style = document.createElement('style');
                style.id = 'notificationStyles';
                style.textContent = `
            @keyframes notificationSlideIn {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
                document.head.appendChild(style);
            }
            document.body.appendChild(notification);
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }

        return {
            pageInit: pageInit


        };

    });
