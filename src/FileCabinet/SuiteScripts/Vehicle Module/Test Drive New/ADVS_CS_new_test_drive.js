/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {
    
    // Global variables
    let currentDate = new Date();
    let currentView = 'day';
    let bookings = {};
    let selectedSlot = null;
    let editingBooking = null;
    
    const vehicles = [
        { id: 1, make: 'Mazda', model: 'CX-5', year: '2019', vin: '123456789', plateNo: 'ABC-123' },
        { id: 2, make: 'Rolls Royce', model: 'Ghost', year: '2025', vin: '123456abcdef', plateNo: 'XYZ-789' },
        { id: 3, make: 'Mazda', model: 'CX-5', year: '2025', vin: '19XFB2F51CE058522', plateNo: 'DEF-456' },
        { id: 4, make: 'Mazda', model: 'CX30', year: '2021', vin: '1C4BJWFG2FL602789', plateNo: 'GHI-101' },
        { id: 5, make: 'Mazda', model: 'CX30', year: '2024', vin: '1FAHP2EW6AG129978', plateNo: 'JKL-202' },
        { id: 6, make: 'Mazda', model: 'CX-5', year: '2024', vin: '1FM5K7D82FGA08413', plateNo: 'MNO-303' },
        { id: 7, make: 'Mazda', model: 'CX30', year: '2024', vin: '1FTJW36F1SEA34096', plateNo: 'PQR-404' },
        { id: 8, make: 'Mazda', model: 'CX30', year: '2024', vin: '3G4AG55M8RS622999', plateNo: 'STU-505' }
    ];

    const timeSlots = [];
    for (let hour = 8; hour <= 19; hour++) {
        timeSlots.push(hour.toString().padStart(2, '0') + ':00');
    }
    
    function pageInit(context) {
        console.log('Test Drive Scheduler initialized');
        
        // Use jQuery document ready
        $(document).ready(function() {
            initializeScheduler();
        });
    }
    
    function initializeScheduler() {
        try {
            // Populate form selects
            populateTimeSelects();
            populateVehicleSelect();
            
            // Add sample bookings for demo
            addSampleBookings();
            
            // Render initial calendar
            renderCalendar();
            
            // Bind events
            bindEvents();
            
            // Expose functions to global scope for HTML onclick handlers
            window.goToToday = goToToday;
            window.navigate = navigate;
            window.changeView = changeView;
            window.toggleFilter = toggleFilter;
            window.renderCalendar = renderCalendar;
            window.closeModal = closeModal;
            window.deleteBooking = deleteBooking;
            
            console.log('Test Drive Scheduler fully initialized');
        } catch (error) {
            console.error('Error initializing scheduler:', error);
        }
    }
    
    function populateTimeSelects() {
        try {
            const $startTime = $('#startTime');
            const $endTime = $('#endTime');
            
            if ($startTime.length === 0 || $endTime.length === 0) {
                console.warn('Time select elements not found');
                return;
            }
            
            $.each(timeSlots, function(index, time) {
                $startTime.append($('<option>', {
                    value: time,
                    text: time
                }));
                
                $endTime.append($('<option>', {
                    value: time,
                    text: time
                }));
            });
        } catch (error) {
            console.error('Error populating time selects:', error);
        }
    }

    function populateVehicleSelect() {
        try {
            const $vehicleSelect = $('#selectedVehicle');
            
            if ($vehicleSelect.length === 0) {
                console.warn('Vehicle select element not found');
                return;
            }
            
            $.each(vehicles, function(index, vehicle) {
                $vehicleSelect.append($('<option>', {
                    value: vehicle.id,
                    text: vehicle.vin + ' - ' + vehicle.make + ' ' + vehicle.model + ' ' + vehicle.year
                }));
            });
        } catch (error) {
            console.error('Error populating vehicle select:', error);
        }
    }

    function bindEvents() {
        try {
            // Modal overlay click
            $('#modalOverlay').off('click').on('click', function(e) {
                if (e.target === e.currentTarget) {
                    closeModal();
                }
            });

            // Form submission
            $('#bookingForm').off('submit').on('submit', function(e) {
                handleBooking(e);
            });

            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            $('#testDriveDate').val(today);
            $('#endDate').val(today);
            
            // Hide tooltip when clicking elsewhere
            $(document).off('click.tooltip').on('click.tooltip', hideTooltip);
            
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    function toggleFilter() {
        try {
            const $sidebar = $('#filterSidebar');
            const $overlay = $('#sidebarOverlay');
            
            if ($sidebar.hasClass('open')) {
                $sidebar.removeClass('open');
                $overlay.removeClass('show');
            } else {
                $sidebar.addClass('open');
                $overlay.addClass('show');
            }
        } catch (error) {
            console.error('Error toggling filter:', error);
        }
    }

    function renderCalendar() {
        try {
            updateDateDisplay();
            if (currentView === 'day') {
                renderDayView();
            } else if (currentView === 'week') {
                renderWeekView();
            } else if (currentView === 'month') {
                renderMonthView();
            }
        } catch (error) {
            console.error('Error rendering calendar:', error);
        }
    }

    function updateDateDisplay() {
        try {
            const dateStr = currentDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            $('#currentDate').text(dateStr);
        } catch (error) {
            console.error('Error updating date display:', error);
        }
    }

    function changeView(view) {
        try {
            currentView = view;
            
            $('.view-btn').removeClass('active');
            $('[onclick*="changeView(\'' + view + '\')"]').addClass('active');
            
            $('.day-view, .week-view, .month-view').removeClass('active');
            $('#' + view + 'View').addClass('active');
            
            renderCalendar();
        } catch (error) {
            console.error('Error changing view:', error);
        }
    }

    function renderDayView() {
        try {
            renderTimeHeader();
            renderScheduleRows();
        } catch (error) {
            console.error('Error rendering day view:', error);
        }
    }

    function renderTimeHeader() {
        try {
            const $header = $('#timeHeader');
            if ($header.length === 0) {
                console.warn('Time header element not found');
                return;
            }
            
            $header.empty();

            $.each(timeSlots, function(index, time) {
                const $slot = $('<div>', {
                    class: 'time-slot-header',
                    text: time
                });
                $header.append($slot);
            });
        } catch (error) {
            console.error('Error rendering time header:', error);
        }
    }

    function renderScheduleRows() {
        try {
            const $container = $('#scheduleRows');
            if ($container.length === 0) {
                console.warn('Schedule rows container not found');
                return;
            }
            
            $container.empty();

            $.each(vehicles, function(index, vehicle) {
                const $row = createScheduleRow(vehicle);
                $container.append($row);
            });
        } catch (error) {
            console.error('Error rendering schedule rows:', error);
        }
    }

    function createScheduleRow(vehicle) {
        const $row = $('<div>', { class: 'schedule-row' });

        const $resourceCell = $('<div>', { class: 'resource-cell' });
        
        const $resourceName = $('<div>', {
            class: 'resource-name',
            text: vehicle.make + ' / ' + vehicle.model + ' / ' + vehicle.year
        });
        
        const $resourceDetails = $('<div>', {
            class: 'resource-details',
            text: vehicle.vin + ' / Test Drive'
        });
        
        $resourceCell.append($resourceName, $resourceDetails);

        const $timeGrid = $('<div>', { class: 'time-grid' });

        $.each(timeSlots, function(index, time) {
            const $cell = $('<div>', { class: 'time-cell' });
            
            $cell.off('dblclick').on('dblclick', function() {
                openBookingModal(vehicle, time);
            });
            
            $timeGrid.append($cell);
        });

        renderBookingsForVehicle($timeGrid, vehicle.id);

        $row.append($resourceCell, $timeGrid);
        return $row;
    }

    function renderBookingsForVehicle($timeGrid, vehicleId) {
        const dateKey = currentDate.toDateString();
        const bookingsData = bookings[dateKey] || [];
        const vehicleBookings = bookingsData.filter(b => b.vehicleId === vehicleId);

        $.each(vehicleBookings, function(index, booking) {
            const startHour = parseInt(booking.startTime.split(':')[0]);
            const endHour = parseInt(booking.endTime.split(':')[0]);
            const startIndex = startHour - 8;
            const duration = endHour - startHour;

            if (startIndex >= 0 && startIndex < timeSlots.length) {
                const colors = ['blue', 'green', 'purple', 'orange'];
                const $bookingBlock = $('<div>', {
                    class: 'booking-block booking-' + colors[index % colors.length],
                    text: booking.customerName
                });
                
                const cellWidth = 100 / timeSlots.length;
                $bookingBlock.css({
                    left: (startIndex * cellWidth) + '%',
                    width: (duration * cellWidth) + '%'
                });

                // Add hover events for tooltip
                $bookingBlock.off('mouseenter mouseleave mousemove dblclick')
                    .on('mouseenter', function(e) {
                        showTooltip(e, booking, vehicleId);
                    })
                    .on('mouseleave', hideTooltip)
                    .on('mousemove', updateTooltipPosition)
                    .on('dblclick', function(e) {
                        e.stopPropagation();
                        editBookingModal(booking, vehicleId);
                    });

                $timeGrid.append($bookingBlock);
            }
        });
    }

    function showTooltip(event, booking, vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        
        const tooltipHtml = '<strong>' + booking.customerName + '</strong><br>' +
                           'Vehicle: ' + vehicle.make + ' ' + vehicle.model + '<br>' +
                           'Time: ' + booking.startTime + ' - ' + booking.endTime + '<br>' +
                           'Plate: ' + (booking.plateNo || 'N/A') + '<br>' +
                           'Opportunity: ' + (booking.opportunity || 'N/A') + '<br>' +
                           'Fuel Out: ' + booking.fuelOut + '%<br>' +
                           'Mileage Out: ' + booking.mileageOut;
        
        $('#bookingTooltip').html(tooltipHtml).addClass('show');
        updateTooltipPosition(event);
    }

    function updateTooltipPosition(event) {
        const $tooltip = $('#bookingTooltip');
        if ($tooltip.hasClass('show')) {
            $tooltip.css({
                left: (event.pageX + 10) + 'px',
                top: (event.pageY - 10) + 'px'
            });
        }
    }

    function hideTooltip() {
        $('#bookingTooltip').removeClass('show');
    }

    function renderWeekView() {
        renderWeekHeader();
        renderWeekGrid();
    }

    function renderWeekHeader() {
        const $header = $('#weekHeader');
        $header.empty();

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            
            const $dayHeader = $('<div>', {
                class: 'week-day-header',
                text: days[i] + ' ' + day.getDate()
            });
            $header.append($dayHeader);
        }
    }

    function renderWeekGrid() {
        const $grid = $('#weekGrid');
        $grid.empty();

        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            
            const $dayCell = $('<div>', { class: 'week-day-cell' });
            
            const $dayNumber = $('<div>', {
                class: 'week-day-number',
                text: day.getDate()
            });
            $dayCell.append($dayNumber);

            const dateKey = day.toDateString();
            const dayBookings = bookings[dateKey] || [];
            
            $.each(dayBookings, function(index, booking) {
                const $bookingDiv = $('<div>', {
                    class: 'week-booking',
                    text: booking.startTime + ' - ' + booking.customerName
                });
                
                $bookingDiv.off('mouseenter mouseleave mousemove dblclick')
                    .on('mouseenter', function(e) {
                        showTooltip(e, booking, booking.vehicleId);
                    })
                    .on('mouseleave', hideTooltip)
                    .on('mousemove', updateTooltipPosition)
                    .on('dblclick', function() {
                        editBookingModal(booking, booking.vehicleId);
                    });
                
                $dayCell.append($bookingDiv);
            });

            $dayCell.off('dblclick').on('dblclick', function(e) {
                if (e.target === $dayCell[0] || e.target === $dayNumber[0]) {
                    currentDate = new Date(day);
                    changeView('day');
                }
            });

            $grid.append($dayCell);
        }
    }

    function renderMonthView() {
        renderMonthHeader();
        renderMonthGrid();
    }

    function renderMonthHeader() {
        const $header = $('#monthHeader');
        $header.empty();

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $.each(days, function(index, day) {
            const $dayHeader = $('<div>', {
                class: 'month-day-header',
                text: day
            });
            $header.append($dayHeader);
        });
    }

    function renderMonthGrid() {
        const $grid = $('#monthGrid');
        $grid.empty();

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const $dayCell = $('<div>', { class: 'month-day' });
            
            if (cellDate.getMonth() !== month) {
                $dayCell.css('opacity', '0.5');
            }
            
            if (cellDate.toDateString() === today.toDateString()) {
                $dayCell.addClass('today');
            }

            const $dayNumber = $('<div>', {
                class: 'month-day-number',
                text: cellDate.getDate()
            });
            $dayCell.append($dayNumber);

            const dateKey = cellDate.toDateString();
            const dayBookings = bookings[dateKey] || [];
            
            $.each(dayBookings, function(index, booking) {
                const $dot = $('<div>', { class: 'month-booking-dot' });
                $dayCell.append($dot);
            });

            $dayCell.off('dblclick').on('dblclick', function() {
                currentDate = new Date(cellDate);
                changeView('day');
            });

            $grid.append($dayCell);
        }
    }

    function goToToday() {
        currentDate = new Date();
        renderCalendar();
    }

    function navigate(direction) {
        if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() + direction);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + (direction * 7));
        } else if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + direction);
        }
        renderCalendar();
    }

    function openBookingModal(vehicle, time) {
        selectedSlot = { vehicle, time };
        editingBooking = null;

        $('#modalTitle').text('Book Test Drive');
        $('#modalSubtitle').text(vehicle.make + ' ' + vehicle.model + ' - ' + time);
        
        $('#selectedVehicle').val(vehicle.id);
        $('#startTime').val(time);
        const endHour = parseInt(time.split(':')[0]) + 1;
        $('#endTime').val(endHour.toString().padStart(2, '0') + ':00');
        
        $('#submitBtn').text('Book Test Drive');
        $('#deleteBtn').hide();
        
        // Clear form
        $('#customerName, #plateNo, #opportunity, #fuelOut, #mileageOut, #fuelIn, #mileageIn').val('');
        
        $('#modalOverlay').addClass('show');
    }

    function editBookingModal(booking, vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        selectedSlot = { vehicle, time: booking.startTime };
        editingBooking = booking;

        $('#modalTitle').text('Edit Test Drive');
        $('#modalSubtitle').text(vehicle.make + ' ' + vehicle.model + ' - ' + booking.startTime);
        
        $('#customerName').val(booking.customerName);
        $('#selectedVehicle').val(vehicleId);
        $('#plateNo').val(booking.plateNo || '');
        $('#opportunity').val(booking.opportunity || '');
        $('#startTime').val(booking.startTime);
        $('#endTime').val(booking.endTime);
        $('#fuelOut').val(booking.fuelOut);
        $('#mileageOut').val(booking.mileageOut);
        $('#fuelIn').val(booking.fuelIn || '');
        $('#mileageIn').val(booking.mileageIn || '');
        
        $('#submitBtn').text('Update Booking');
        $('#deleteBtn').show();
        
        $('#modalOverlay').addClass('show');
    }

    function closeModal() {
        $('#modalOverlay').removeClass('show');
        $('#bookingForm')[0].reset();
        selectedSlot = null;
        editingBooking = null;
    }

    function handleBooking(e) {
        e.preventDefault();
        
        const customerName = $('#customerName').val().trim();
        const vehicleId = parseInt($('#selectedVehicle').val());
        const plateNo = $('#plateNo').val();
        const opportunity = $('#opportunity').val();
        const startTime = $('#startTime').val();
        const endTime = $('#endTime').val();
        const fuelOut = $('#fuelOut').val();
        const mileageOut = $('#mileageOut').val();
        const fuelIn = $('#fuelIn').val();
        const mileageIn = $('#mileageIn').val();

        if (!customerName || !vehicleId || !startTime || !endTime || !fuelOut || !mileageOut) {
            alert('Please fill all required fields');
            return;
        }

        if (startTime >= endTime) {
            alert('End time must be after start time');
            return;
        }

        const dateKey = currentDate.toDateString();
        if (!bookings[dateKey]) {
            bookings[dateKey] = [];
        }

        const booking = {
            id: editingBooking ? editingBooking.id : Date.now(),
            vehicleId,
            customerName,
            plateNo,
            opportunity,
            startTime,
            endTime,
            fuelOut,
            mileageOut: parseInt(mileageOut),
            fuelIn,
            mileageIn: mileageIn ? parseInt(mileageIn) : null
        };

        if (editingBooking) {
            const bookingIndex = bookings[dateKey].findIndex(b => b.id === editingBooking.id);
            if (bookingIndex !== -1) {
                bookings[dateKey][bookingIndex] = booking;
            }
            showNotification('Test drive updated for ' + customerName + '!');
        } else {
            bookings[dateKey].push(booking);
            showNotification('Test drive booked for ' + customerName + '!');
        }

        closeModal();
        renderCalendar();
    }

    function deleteBooking() {
        if (!editingBooking) return;
        
        if (confirm('Are you sure you want to delete this booking?')) {
            const dateKey = currentDate.toDateString();
            if (bookings[dateKey]) {
                bookings[dateKey] = bookings[dateKey].filter(b => b.id !== editingBooking.id);
                if (bookings[dateKey].length === 0) {
                    delete bookings[dateKey];
                }
            }
            
            showNotification('Test drive booking deleted!');
            closeModal();
            renderCalendar();
        }
    }

    function showNotification(message) {
        const $notification = $('<div>', {
            class: 'success-notification',
            text: message
        });
        
        $('body').append($notification);
        
        setTimeout(function() {
            $notification.remove();
        }, 3000);
    }

    function addSampleBookings() {
        const today = new Date().toDateString();
        bookings[today] = [
            {
                id: 1,
                vehicleId: 2,
                customerName: 'Sarah Green',
                plateNo: 'XYZ-789',
                opportunity: 'new-purchase',
                startTime: '10:00',
                endTime: '11:00',
                fuelOut: '100',
                mileageOut: 45234,
                fuelIn: '75',
                mileageIn: 45267
            },
            {
                id: 2,
                vehicleId: 3,
                customerName: 'Vinayak Kumar',
                plateNo: 'DEF-456',
                opportunity: 'trade-in',
                startTime: '11:00',
                endTime: '12:00',
                fuelOut: '100',
                mileageOut: 12543,
                fuelIn: '50',
                mileageIn: 12578
            },
            {
                id: 3,
                vehicleId: 6,
                customerName: 'Vinayak Kumar',
                plateNo: 'MNO-303',
                opportunity: 'lease',
                startTime: '09:00',
                endTime: '10:00',
                fuelOut: '75',
                mileageOut: 34521,
                fuelIn: '50',
                mileageIn: 34556
            },
            {
                id: 4,
                vehicleId: 6,
                customerName: 'Sarah Johnson',
                plateNo: 'MNO-303',
                opportunity: 'new-purchase',
                startTime: '14:00',
                endTime: '15:00',
                fuelOut: '50',
                mileageOut: 34556,
                fuelIn: '25',
                mileageIn: 34589
            }
        ];

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        bookings[tomorrow.toDateString()] = [
            {
                id: 5,
                vehicleId: 1,
                customerName: 'John Doe',
                plateNo: 'ABC-123',
                opportunity: 'new-purchase',
                startTime: '14:00',
                endTime: '15:00',
                fuelOut: '100',
                mileageOut: 23456,
                fuelIn: '75',
                mileageIn: 23489
            }
        ];

        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        bookings[dayAfter.toDateString()] = [
            {
                id: 6,
                vehicleId: 4,
                customerName: 'Alice Smith',
                plateNo: 'GHI-101',
                opportunity: 'trade-in',
                startTime: '16:00',
                endTime: '17:00',
                fuelOut: '75',
                mileageOut: 45621,
                fuelIn: '50',
                mileageIn: 45652
            }
        ];
    }

    return {
        pageInit: pageInit
    };
});