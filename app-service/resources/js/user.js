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
        var quesContent = document.querySelector('.page-edit-question #content');

        var language = $('.page-edit-question #update-ques #select-lg option:selected').data('mode');

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
        var search = document.querySelector('.questions-container .question-search .search-query').value;
        var lg = document.querySelector('.questions-container .question-search .select-language').value;
        $.ajax({
            type: "POST",
            url: "/question/search",
            data: {
                search: search,
                lg_id: lg
            },
            success: function (response) {
                var result = JSON.parse(response);
                var name = $('meta[name=username]').attr("content");
                var html = '';
                result.forEach(element => {
                    html += '<li class="question">';
                    html +=     '<a href="/user/questions/' + element.id + '">';
                    html +=         '<h4>' + element.title + '</h4>';
                    html +=         '<p class="metadata">' + element.name + ' by ' + name + '</p>';
                    html +=     '</a>';
                    html += '</li>';
                });
                $('.question-list .list-wrapper').html(html);
            }
        });
    }

    function ajaxSearchingPads() {
        var search = document.querySelector('.page-pads-container .pad-filters #search').value;
        var status = document.querySelector('.page-pads-container .pad-filters #filter-status').value;
        var lg = document.querySelector('.page-pads-container .pad-filters #filter-lg').value;
        $.ajax({
            type: "POST",
            url: "/pad/search",
            data: {
                search: search,
                status: status,
                lg_id: lg
            },
            success: function (response) {
                let pads = JSON.parse(response);
                let tbody = document.querySelector('.pads-container .table tbody');
                // empty tbody
                while (tbody.lastChild) {
                    tbody.removeChild(tbody.lastChild);
                }
                // Add new value to tbody
                if (pads.length == 0) {
                    let html = `<tr>
                                    <td colspan="7">No matching records found</td>
                                </tr>`;
                    tbody.innerHTML = html;
                } else {
                    pads.forEach(pad => {
                        let tpl = document.querySelector('#pad-row');
                        let clone = tpl.content.cloneNode(true);
                        let td = clone.querySelectorAll('td');
                        td[0].innerText = pad.title;
                        td[1].innerText = pad.status;
                        td[2].innerText = pad.interviewees;
                        td[3].innerText = pad.created;
                        td[4].innerText = pad.language;
                        let goto = clone.querySelector('a.goto-pad');
                        goto.href = pad.view_route;
                        goto.innerText = pad.view_text;
                        let action = clone.querySelector('a.red-btn');
                        action.classList.add(pad.action_text);
                        action.href = pad.action_route;
                        action.innerText = pad.action_text;
                        tbody.appendChild(clone);
                    });

                    $('a.red-btn.End').click(function (e) {
                        e.preventDefault();
                        $('#modalEnd .modal-footer form').prop('action', ($(this).prop('href')));
                        $('#modalEnd').modal('show');
                    });

                    $('a.red-btn.Delete').click(function (e) {
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

        // Listen to event
        // window.Echo.channel(`pad-${id}-user-update`)
        //     .listen('PadNoteUpdate', (e) => {
        //         setTimeout(function () {
        //             $('textarea#note').val(e.note);
        //         }, 50);
        //     })
        //     .listen('PadTitleUpdate', (e) => {
        //         setTimeout(function () {
        //             $('.footer-right .title').val(e.title);
        //         }, 50);
        //     });
    }

    // New question page
    if ($('.interviewer-wrapper').hasClass('page-new-question')) {
        codeMirrorForQuestion();
    }

    // Edit question page
    if ($('.main-page-content').hasClass('page-edit-question')) {
        codeMirrorEditQuestion();
    }

    // Manage questions page
    if ($('.interviewer-wrapper').hasClass('page-questions')) {
        if ($('.question-right .question-detail .question-content').length) {
            codeMirrorForShowingQuestion();
        }

        $('.questions-container .question-search .search-query').on('input', function () {
            ajaxSearchingQuestions();
        })

        $('.questions-container .question-search .select-language').change(function (e) {
            e.preventDefault();
            ajaxSearchingQuestions();
        });
    }

    // Manage pads page
    if ($('.main-page-content').hasClass('page-pads')) {
        $('.page-pads-container .pad-filters #search').on('input', function () {
            ajaxSearchingPads();
        })

        $('.page-pads-container .pad-filters #filter-status').change(function (e) {
            e.preventDefault();
            ajaxSearchingPads();
        });

        $('.page-pads-container .pad-filters #filter-lg').change(function (e) {
            e.preventDefault();
            ajaxSearchingPads();
        });

        $('a.red-btn.End').click(function (e) {
            e.preventDefault();
            $('#modalEnd .modal-footer form').prop('action', ($(this).prop('href')));
            $('#modalEnd').modal('show');
        });

        $('a.red-btn.Delete').click(function (e) {
            e.preventDefault();
            $('#modalDelete .modal-footer form').prop('action', ($(this).prop('href')));
            $('#modalDelete').modal('show');
        });
    }

    // Manage interviewees page
    if ($('.main-page-content').hasClass('page-interviewees')) {
        function searchInterviewees() {
            let name = document.querySelector('.interviewee-filters .search #search').value,
                time = document.querySelector('.interviewee-filters .filter #filter-date').value;
            $.ajax({
                type: "post",
                url: "/interviewee/search",
                data: { name: name, time: time },
                success: function (interviewees) {
                    let tbody = document.querySelector('.interviewees-container .table tbody');

                    // empty tbody
                    while (tbody.lastChild) {
                        tbody.removeChild(tbody.lastChild);
                    }

                    // Add new value to tbody
                    if (interviewees.length == 0) {
                        let html = `<tr>
                                        <td colspan="5">No matching records found</td>
                                    </tr>`;
                        tbody.innerHTML = html;
                    } else {
                        interviewees.forEach(item => {
                            html = `<tr>
                                        <td rowspan="${item.pads.length}">${item.name}</td>`;
                            item.pads.forEach((element, index) => {
                                if (index === 0) {
                                    html += `
                                            <td>${element.title}</td>
                                            <td>${element.name}</td>
                                            <td>${element.created}</td>
                                            <td>
                                                <a href="/pad/${element.id}" target="_blank">View</a>
                                            </td>
                                        </tr>`;
                                } else {
                                    html += `
                                        <tr>
                                            <td>${element.title}</td>
                                            <td>${element.name}</td>
                                            <td>${element.created}</td>
                                            <td>
                                                <a href="/pad/${element.id}" target="_blank">View</a>
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

        $('.interviewee-filters .search #search').on('input', function () {
            searchInterviewees();
        })

        $('.interviewee-filters .filter #filter-date').change(function (e) {
            e.preventDefault();
            searchInterviewees();
        });
    }
});
