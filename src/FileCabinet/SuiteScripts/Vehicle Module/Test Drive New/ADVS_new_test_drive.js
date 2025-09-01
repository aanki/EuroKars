/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/format', 'N/runtime'],

    (serverWidget) => {

        const onRequest = (scriptContext) => {

            if (scriptContext.request.method === 'GET') {

                var form = serverWidget.createForm({
                    title: ' ',
                    hideNavBar: true
                });
                const html = `
              
             <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Drive Calendar - NetSuite</title>
    <!-- Link to external CSS file -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <link rel="stylesheet" href="https://9908878-sb1.app.netsuite.com/core/media/media.nl?id=18294&c=9908878_SB1&h=C8ZZBuw5UdzJdSdIctbpNMpsc39rqByOWzZ5F4QV5lJHHAJd&_xt=.css">
</head>

<body>
    <div class="main-container">
        <div class="header">
            <div class="date-navigation">
                <button class="today-btn" onclick="goToToday()">Today</button>
                <button class="nav-btn" onclick="navigate(-1)">‹</button>
                <div class="current-date" id="currentDate">Loading...</div>
                <button class="nav-btn" onclick="navigate(1)">›</button>
            </div>
            
            <div class="location-info">All Locations</div>
            
            <div class="header-controls">
                <div class="view-buttons">
                    <button class="view-btn active" onclick="changeView('day')">Day</button>
                    <button class="view-btn" onclick="changeView('week')">Week</button>
                    <button class="view-btn" onclick="changeView('month')">Month</button>
                </div>
                <button class="filter-btn" onclick="toggleFilter()">Filter</button>
                <button class="refresh-btn" onclick="renderCalendar()">Refresh</button>
            </div>
        </div>

        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleFilter()"></div>

        <div class="filter-sidebar" id="filterSidebar">
            <div class="filter-header">
                <div class="filter-title">Filter Options</div>
                <button class="close-sidebar" onclick="toggleFilter()">×</button>
            </div>
            
            <div class="filter-group">
                <div class="filter-group-title">Subsidiary</div>
                <select class="filter-select" id="subsidiaryFilter">
                    <option value="">-- Select Subsidiary --</option>
                    <option value="main">Main Branch</option>
                    <option value="north">North Branch</option>
                    <option value="south">South Branch</option>
                </select>
            </div>
            
            <div class="filter-group">
                <div class="filter-group-title">Model</div>
                <select class="filter-select" id="modelFilter">
                    <option value="">All</option>
                    <option value="cx5">CX-5</option>
                    <option value="cx30">CX30</option>
                    <option value="ghost">Ghost</option>
                </select>
            </div>
            
            <div class="filter-group">
                <div class="filter-group-title">Location</div>
                <select class="filter-select" id="locationFilter">
                    <option value="">-- Select Location --</option>
                    <option value="showroom1">Main Showroom</option>
                    <option value="showroom2">Downtown Branch</option>
                    <option value="showroom3">Mall Location</option>
                </select>
            </div>
        </div>

        <div class="schedule-container">
            <div class="day-view active" id="dayView">
                <div class="time-header">
                    <div class="resource-header">Vehicle / Test Drive</div>
                    <div class="time-slots-header" id="timeHeader"></div>
                </div>
                <div class="schedule-rows" id="scheduleRows"></div>
            </div>

            <div class="week-view" id="weekView">
                <div class="week-header" id="weekHeader"></div>
                <div class="week-grid" id="weekGrid"></div>
            </div>

            <div class="month-view" id="monthView">
                <div class="month-header" id="monthHeader"></div>
                <div class="month-grid" id="monthGrid"></div>
            </div>
        </div>
    </div>

    <!-- Tooltip for booking details -->
    <div id="bookingTooltip" class="booking-tooltip"></div>

    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <div class="modal-title" id="modalTitle">Book Test Drive</div>
            <div id="modalSubtitle" style="text-align: center; color: #64748b; margin-bottom: 20px;"></div>
            <form id="bookingForm">
                <div class="form-group">
                    <label class="form-label">Lead/Customer</label>
                    <input type="text" class="form-input" id="customerName" placeholder="Search Customer" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Vehicle</label>
                    <select class="form-select" id="selectedVehicle" required>
                        <option value="">Select Vehicle</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Plate No</label>
                    <select class="form-select" id="plateNo">
                        <option value="">Select Plate Number</option>
                        <option value="ABC-123">ABC-123</option>
                        <option value="XYZ-789">XYZ-789</option>
                        <option value="DEF-456">DEF-456</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Opportunity</label>
                    <select class="form-select" id="opportunity">
                        <option value="">Select Opportunity</option>
                        <option value="new-purchase">New Purchase</option>
                        <option value="trade-in">Trade-in</option>
                        <option value="lease">Lease</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Time period</label>
                    <div class="form-row">
                        <input type="date" class="form-input" id="testDriveDate" required>
                        <select class="form-select" id="startTime" required>
                            <option value="">Start Time</option>
                        </select>
                    </div>
                    <div class="form-row" style="margin-top: 10px;">
                        <input type="date" class="form-input" id="endDate">
                        <select class="form-select" id="endTime" required>
                            <option value="">End Time</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Fuel Out</label>
                    <select class="form-select" id="fuelOut">
                        <option value="">Select Fuel Level</option>
                        <option value="100">100%</option>
                        <option value="75">75%</option>
                        <option value="50">50%</option>
                        <option value="25">25%</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Mileage Out</label>
                    <input type="number" class="form-input" id="mileageOut" placeholder="Enter mileage" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Fuel In</label>
                    <select class="form-select" id="fuelIn">
                        <option value="">Select Fuel Level</option>
                        <option value="100">100%</option>
                        <option value="75">75%</option>
                        <option value="50">50%</option>
                        <option value="25">25%</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Mileage In</label>
                    <input type="number" class="form-input" id="mileageIn" placeholder="Enter return mileage">
                </div>

                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="button" class="btn btn-danger" id="deleteBtn" onclick="deleteBooking()" style="display: none;">Delete</button>
                    <button type="submit" class="btn btn-primary" id="submitBtn">Book Test Drive</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>

             `;
                form.addField({
                    id: 'custpage_customhtml',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'HTML'
                }).defaultValue = html;
                form.clientScriptModulePath = './ADVS_CS_new_test_drive.js';
                scriptContext.response.writePage(form);

            }
            else if (scriptContext.request.method === 'POST') {


            }

        }

        return { onRequest }

    });
