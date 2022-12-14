$(document).ready(function () {
    $('.nav-menu > li > a').each(function (index, element) {
        if ($(element).attr('href') == window.location.href) {
            $(element).parent().addClass('active');
        };
    });

    $('.questions-container .question-list > li > a').each(function (index, element) {
        if ($(element).attr('href') == window.location.href) {
            $(element).parent().addClass('active');
        };
    });

    function codeMirrorForQuestion() {
        var quesContent = document.querySelector('.codemirror-new-ques #content');
        var language = $('#new-ques .form-group #select-lg option:selected').data('mode');

        var question = CodeMirror.fromTextArea(quesContent, {
            lineNumbers: true,
            lineWrapping: true,
            mode: language,
            matchBrackets: true,
            autoRefresh: false,
            autoCloseTags: true,
            autoCloseBrackets: true,
            styleActiveLine: { nonEmpty: false },
            indentUnit: 2,
            tabSize: 2,
            extraKeys: {
                'Ctrl-/': 'toggleComment',
                'Cmd-/': 'toggleComment',
            }
        });

        $('#new-ques .form-group #select-lg ').change(function (e) {
            console.log(1)
            e.preventDefault();
            language = $('#new-ques .form-group #select-lg  option:selected').data('mode');
            question.setOption("mode", language);
        });
    }

    function codeMirrorForShowingQuestion() {
        var container = document.querySelector('.question-right .question-detail .question-content #cmr');

        var language = $(container).data('lg');
        var content = $(container).text();

        var question = CodeMirror.fromTextArea(container, {
            lineWrapping: true,
            mode: language,
            readOnly: 'nocursor'
        });

        // Set value for CodeMirror
        question.getDoc().setValue(content);
    }

    function codeMirrorEditQuestion() {
        var quesContent = document.querySelector('#codemirror-edit-ques');

        var language = $('#select-lg-update option:selected').data('mode');

        var content = $(quesContent).text();

        var question = CodeMirror.fromTextArea(quesContent, {
            lineNumbers: true,
            lineWrapping: true,
            mode: language,
            autoRefresh: false,
            tabSize: 2
        });

        // Set value for CodeMirror
        question.getDoc().setValue(content);

        $('.page-edit-question #update-ques #select-lg').change(function (e) {
            e.preventDefault();
            language = $('.page-edit-question #update-ques #select-lg option:selected').data('mode');
            question.setOption("mode", language);
        });
    }

    function ajaxSearchingQuestions() {
        let search = $('.filter .search-question').val();
        let url = $('.filter .search-question').data('url');
        let lg = $('select[name="filter-lg-question"]').val();
        $.ajax({
            type: "POST",
            url: url,
            data: {
                search: search,
                lg_id: lg
            },
            success: function (response) {
                let result = JSON.parse(response),
                    name = $('meta[name=username]').attr("content"),
                    html = '';
                result.forEach(element => {
                    html += '<li class="question">';
                    html +=     '<a href="/interviewer/questions/' + element.id + '">';
                    html +=         '<h5>' + element.title + '</h5>';
                    html +=         '<span>' + element.name + ' by ' + name + '</span>';
                    html +=     '</a>';
                    html += '</li>';
                });
                $('.list-wrapper').html(html);
            }
        });
    }

    function ajaxSearchingPads() {
        let search = $('#interviewer-search-pad').val(),
            url = $('#interviewer-search-pad').data('url'),
            status = $('#filter-pad-status').val(),
            lg = $('#filter-pad-lg').val();
        $.ajax({
            type: "POST",
            url: url,
            data: {
                search: search,
                status: status,
                lg_id: lg
            },
            success: function (response) {
                let pads = JSON.parse(response);
                let tbody = $('.interviewee-table .table tbody');
                // empty tbody
                tbody.empty();
                // Add new value to tbody
                if (pads.length == 0) {
                    let html = `<tr>
                                    <td colspan="7">No matching records found</td>
                                </tr>`;
                    tbody.append(html);
                } else {
                    let html = ``;
                    pads.forEach(pad => {
                        html += `<tr>
                                    <td>${pad.title}</td>`;
                        html += `<td>${pad.status}</td>`;
                        html += `<td>${ pad.interviewees }</td>`;
                        html += `<td>${ pad.created}</td>`;
                        html += `<td>${ pad.language}</td>`;
                        switch (pad.status) {
                            case 'In progress':
                                html += `<td>
                                            <a href="/pad/${pad.id}" class="btn btn-primary" target="_blank">Edit</a>
                                        </td>
                                        <td>
                                            <a href="/pad/${pad.id}" class="btn btn-warning End">End</a>
                                        </td>`;
                                break;
                            case 'Unused':
                                html += `<td>
                                            <a href="/pad/${pad.id}" class="btn btn-success" target="_blank">Start</a>
                                        </td>
                                        <td>
                                            <a href="/pad/${pad.id}" class="btn btn-danger Delete">Delete</a>
                                        </td>`;
                                break;
                            case 'Ended':
                                html += `<td>
                                            <a href="/pad/${pad.id}" class="btn btn-primary" target="_blank">View</a>
                                        </td>
                                        <td>
                                            <a href="/pad/${pad.id}" class="btn btn-danger Delete">Delete</a>
                                        </td>`;
                            default:
                                break;

                        }

                    });
                    tbody.append(html);
                    $('.End').click(function (e) {
                        e.preventDefault();
                        $('#modalEnd .modal-footer form').prop('action', ($(this).prop('href')));
                        $('#modalEnd').modal('show');
                    });

                    $('.Delete').click(function (e) {
                        e.preventDefault();
                        $('#modalDelete .modal-footer form').prop('action', ($(this).prop('href')));
                        $('#modalDelete').modal('show');
                    });
                }
            }
        });
    }

    // Page pad
    if ($(document.body).hasClass('page-pad')) {
        let pad_id = $('meta[name="pad_id"]').attr('content'),
            sid = $('meta[name="sid"]').attr('content'),
            name = $('.full-screen-overlay .enter-content #candidate_name').val(),
            firebaseToken = '';

        if (firebase.messaging.isSupported()) {
            const messaging = firebase.messaging();

            messaging
                .requestPermission()
                .then(function () {
                    // get the token in the form of promise
                    return messaging.getToken();
                })
                .then(function(token) {
                    firebaseToken = token;
                    addMember();
                })
                .catch(function (err) {
                    console.log("Unable to get permission to notify.", err);
                    addMember();
                });

            // Handle incoming messages. Called when:
            // - a message is received while the app has focus
            // - the user clicks on an app notification created by a service worker
            //   `messaging.setBackgroundMessageHandler` handler.
            messaging.onMessage((payload) => {
                alert(payload.data.body);
            });
        } else {
            addMember();
            console.log("This browser doesn't support FCM");
        }

        $('.RightPanel .topbar .tabs li').click(function(e) {
            $(this).addClass('active');
            $(this).siblings().removeClass('active');
            let my_console = $('.right-wrapper .console'),
                notes = $('.right-wrapper .notes');
            if ($(e.target).hasClass('output')) {
                my_console.css('display', 'block');
                notes.hide();
            } else {
                my_console.hide();
                notes.css('display', 'block');
            }
        });

        function addMember() {
            $.ajax({
                type: "POST",
                url: `/pad/${pad_id}/add_member`,
                data: {
                    value: {
                        session_id: sid,
                        name: name,
                        token: firebaseToken
                    }
                }
            });
        }

        let id = $('meta[name="pad_id"]').attr('content');

        // Handle event to update pad
        $('.footer-right .title').on('input', function () {
            let title = $('.footer-right .title').val();
            $.ajax({
                type: "PUT",
                url: "/pad/" + id + "/edit",
                data: {
                    value: {
                        title: title
                    }
                }
            });
        });

        $('textarea#note').on('input', function () {
            let note = $('.right-wrapper #note').val();
            $.ajax({
                type: "PUT",
                url: "/pad/" + id + "/edit",
                data: {
                    value: {
                        note: note
                    }
                },
            }).fail((data) => {alert(data)});
        });
        var pusher = new Pusher('1dcf4e7608b407bd1a07', {
            cluster: 'ap1'
        });

        var channel = pusher.subscribe(`pad-${id}-user-update`);
        channel.bind('note-update', (e) => {
            setTimeout(function () {
                $('textarea#note').val(e.note);
            }, 50);
        })
        channel.bind('title-update', (e) => {
            setTimeout(function () {
                $('.footer-right .title').val(e.title);
            }, 50);
        })
    }

    // New question page
    if ($('.interviewer-wrapper').hasClass('page-new-question')) {
        codeMirrorForQuestion();
    }

    // Edit question page
    if ($('.interviewer-wrapper').hasClass('page-edit-question')) {
        codeMirrorEditQuestion();
    }

    // Manage questions page
    if ($('.interviewer-wrapper').hasClass('page-questions')) {
        if ($('.question-right .question-detail .question-content').length) {
            codeMirrorForShowingQuestion();
        }

        $('.filter .search-question').on('input', function () {
            ajaxSearchingQuestions();
        })

        $('.filter .filter-lg-question').change(function (e) {
            e.preventDefault();
            ajaxSearchingQuestions();
        });
    }

    // Manage pads page
    if ($('.interviewer-wrapper').hasClass('page-pads')) {
        $('#interviewer-search-pad').on('input', function () {
            ajaxSearchingPads();
        })

        $('#filter-pad-status').change(function (e) {
            e.preventDefault();
            ajaxSearchingPads();
        });

        $('#filter-pad-lg').change(function (e) {
            e.preventDefault();
            ajaxSearchingPads();
        });

        $('.End').click(function (e) {
            e.preventDefault();
            $('#modalEnd .modal-footer form').prop('action', ($(this).prop('href')));
            $('#modalEnd').modal('show');
        });

        $('.Delete').click(function (e) {
            e.preventDefault();
            $('#modalDelete .modal-footer form').prop('action', ($(this).prop('href')));
            $('#modalDelete').modal('show');
        });
    }

    // Manage interviewees page
    if ($('.interviewer-wrapper').hasClass('page-interviewees')) {
        function searchInterviewees() {
            let name = $("#search-name").val(),
            url = $("#search-name").data('url'),
                time = $('#filter-date').val();
                console.log(time);
            $.ajax({
                type: "post",
                url: url,
                data: { name: name, time: time },
                success: function (interviewees) {
                    let tbody = $('#tbody');
                    console.log(interviewees.length);
                    // empty tbody
                    tbody.empty();
                    // Add new value to tbody
                    if (interviewees.length == 0) {
                        let html = `<tr>
                                        <td colspan="5">No matching records found</td>
                                    </tr>`;
                        $(tbody).append(html);
                    } else {
                        interviewees.forEach(item => {
                            html = `<tr>
                                        <td rowspan="${item.pads.length}" style="vertical-align: middle">${item.name}</td>`;
                            item.pads.forEach((element, index) => {
                                if (index === 0) {
                                    html += `
                                            <td>${element.title}</td>
                                            <td>${element.name}</td>
                                            <td>${element.created}</td>
                                            <td>
                                                <a href="/pad/${element.id}" target="_blank"><i class="fa fa-eye text-success fs-4 ms-4"></i></a>
                                            </td>
                                        </tr>`;
                                } else {
                                    html += `
                                        <tr>
                                            <td>${element.title}</td>
                                            <td>${element.name}</td>
                                            <td>${element.created}</td>
                                            <td>
                                                <a href="/pad/${element.id}" target="_blank"><i class="fa fa-eye text-success fs-4 ms-4"></i></a>
                                            </td>
                                        </tr>`;
                                }
                            });
                            $(tbody).append(html);
                        });
                    }
                }
            });
        }

        $("#search-name").on('input', function () {
            searchInterviewees();
        })

        $('#filter-date').change(function (e) {
            e.preventDefault();
            searchInterviewees();
        });
    }
});
