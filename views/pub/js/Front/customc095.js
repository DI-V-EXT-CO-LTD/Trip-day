(function($) {
    "use strict";
    $(document).ready(function() {
        //모바일 메뉴
		$(function() {
            function mmenuInit() {
                var wi = $(window).width();
                if (wi <= '1099') {
                    $(".mmenu-init").remove();
                    $("#navigation").clone().addClass("mmenu-init").insertBefore("#navigation").removeAttr('id').removeClass('style-1 style-2').find('ul, div').removeClass('style-1 style-2 mega-menu mega-menu-content mega-menu-section').removeAttr('id');
                    $(".mmenu-init").find("ul").addClass("mm-listview");
                    $(".mmenu-init").find(".mobile-styles .mm-listview").unwrap();
                    $(".mmenu-init").mmenu({
                        "counters": true
                    }, {
                        offCanvas: {
                            pageNodetype: "#wrapper"
                        }
                    });
                    var mmenuAPI = $(".mmenu-init").data("mmenu");
                    var $icon = $(".mmenu-trigger .hamburger");
                    $(".mmenu-trigger").on('click', function() {
                        mmenuAPI.open();
                    });
                }
                $(".mm-next").addClass("mm-fullsubopen");
            }
            mmenuInit();
            $(window).resize(function() {
                mmenuInit();
            });
        });
		
		//상단메뉴 스크롤
        function stickyHeader() {
            $(window).on('scroll load', function() {
                if ($(window).width() < '1099') {
                    $("#header-container").removeClass("cloned");
                }
                if ($(window).width() > '1099') {
                    $("#header-container").css({
                        position: 'fixed',
                    });
                    var headerOffset = $("#header-container").height();
                    if ($(window).scrollTop() >= headerOffset) {
                        $("#header-container").addClass('cloned');
                        $(".wrapper-with-transparent-header #header-container").addClass('cloned').removeClass("transparent-header unsticky");
                    } else {
                        $("#header-container").removeClass("cloned");
                        $(".wrapper-with-transparent-header #header-container").addClass('transparent-header unsticky').removeClass("cloned");
                    }
                    var transparentLogo = $('#header-container #logo img').attr('data-transparent-logo');
                    var stickyLogo = $('#header-container #logo img').attr('data-sticky-logo');
                    if ($('.wrapper-with-transparent-header #header-container').hasClass('cloned')) {
                        $("#header-container.cloned #logo img").attr("src", stickyLogo);
                    }
                    if ($('.wrapper-with-transparent-header #header-container').hasClass('transparent-header')) {
                        $("#header-container #logo img").attr("src", transparentLogo);
                    }
                    //$(window).on('load resize', function() {
                    //    var headerOffset = $("#header-container").height();
                    //    $("#wrapper").css({
                    //        'padding-top': headerOffset
                    //    });
                   // });
                }
            });
        }
        stickyHeader();
        $(window).on('load resize', function() {
            var transparentHeaderHeight = $('.transparent-header').outerHeight();
            $('.transparent-header-spacer').css({
                height: transparentHeaderHeight,
            });
        });
		
		// 페이지 맨 위로
        function backToTop() {
            $('body').append('<div id="backtotop"><a href="#"></a></div>');
        }
        backToTop();
        var pxShow = 600;
        var scrollSpeed = 500;
        $(window).scroll(function() {
            if ($(window).scrollTop() >= pxShow) {
                $("#backtotop").addClass('visible');
            } else {
                $("#backtotop").removeClass('visible');
            }
        });
        $('#backtotop a').on('click', function() {
            $('html, body').animate({
                scrollTop: 0
            }, scrollSpeed);
            return false;
        });

		// 모바일 쪽지 레이어
        $(".header-notifications").each(function() {
            var userMenu = $(this);
            var userMenuTrigger = $(this).find('.header-notifications-trigger a');
            $(userMenuTrigger).on('click', function(event) {
                event.preventDefault();
                if ($(this).closest(".header-notifications").is(".active")) {
                    close_user_dropdown();
                } else {
                    close_user_dropdown();
                    userMenu.addClass('active');
                }
            });
        });

        function close_user_dropdown() {
            $('.header-notifications').removeClass("active");
        }
        var mouse_is_inside = false;
        $(".header-notifications").on("mouseenter", function() {
            mouse_is_inside = true;
        });
        $(".header-notifications").on("mouseleave", function() {
            mouse_is_inside = false;
        });
        $("body").mouseup(function() {
            if (!mouse_is_inside) close_user_dropdown();
        });
        $(document).keyup(function(e) {
            if (e.keyCode == 27) {
                close_user_dropdown();
            }
        });
       

		//아코디언
        var accordion = (function() {
            var $accordion = $('.js-accordion');
            var $accordion_header = $accordion.find('.js-accordion-header');
            var settings = {
                speed: 400,
                oneOpen: false
            };
            return {
                init: function($settings) {
                    $accordion_header.on('click', function() {
                        accordion.toggle($(this));
                    });
                    $.extend(settings, $settings);
                    if (settings.oneOpen && $('.js-accordion-item.active').length > 1) {
                        $('.js-accordion-item.active:not(:first)').removeClass('active');
                    }
                    $('.js-accordion-item.active').find('> .js-accordion-body').show();
                },
                toggle: function($this) {
                    if (settings.oneOpen && $this[0] != $this.closest('.js-accordion').find('> .js-accordion-item.active > .js-accordion-header')[0]) {
                        $this.closest('.js-accordion').find('> .js-accordion-item').removeClass('active').find('.js-accordion-body').slideUp();
                    }
                    $this.closest('.js-accordion-item').toggleClass('active');
                    $this.next().stop().slideToggle(settings.speed);
                }
            };
        })();
        $(document).ready(function() {
            accordion.init({
                speed: 300,
                oneOpen: true
            });
        });

        //tabs 모바일에서 로딩으로 인한 터치실행 안됨. $(window).on('load resize',function()을 $(document).ready(function() 변경//
        //아이디 비번찾기 탭
		$(document).ready(function() {
            if ($(".tabs")[0]) {
                $('.tabs').each(function() {
                    var thisTab = $(this);
                    var activePos = thisTab.find('.tabs-header .active').position();

                    function changePos() {
                        activePos = thisTab.find('.tabs-header .active').position();
                        thisTab.find('.tab-hover').stop().css({
                            left: activePos.left,
                            width: thisTab.find('.tabs-header .active').width()
                        });
                    }
                    changePos();
                    var tabHeight = thisTab.find('.tab.active').outerHeight();

                    function animateTabHeight() {
                        tabHeight = thisTab.find('.tab.active').outerHeight();
                        thisTab.find('.tabs-content').stop().css({
                            height: tabHeight + 'px'
                        });
                    }
                    animateTabHeight();

                    function changeTab() {
                        var getTabId = thisTab.find('.tabs-header .active a').attr('data-tab-id');
                        thisTab.find('.tab').stop().fadeOut(300, function() {
                            $(this).removeClass('active');
                        }).hide();
                        thisTab.find('.tab[data-tab-id=' + getTabId + ']').stop().fadeIn(300, function() {
                            $(this).addClass('active');
                            animateTabHeight();
                        });
                    }
                    thisTab.find('.tabs-header a').on('click', function(e) {
                        e.preventDefault();
                        var tabId = $(this).attr('data-tab-id');
                        thisTab.find('.tabs-header a').stop().parent().removeClass('active');
                        $(this).stop().parent().addClass('active');
                        changePos();
                        tabCurrentItem = tabItems.filter('.active');
                        thisTab.find('.tab').stop().fadeOut(300, function() {
                            $(this).removeClass('active');
                        }).hide();
                        thisTab.find('.tab[data-tab-id="' + tabId + '"]').stop().fadeIn(300, function() {
                            $(this).addClass('active');
                            animateTabHeight();
                        });
                    });
                    var tabItems = thisTab.find('.tabs-header ul li');
                    var tabCurrentItem = tabItems.filter('.active');
                    thisTab.find('.tab-next').on('click', function(e) {
                        e.preventDefault();
                        var nextItem = tabCurrentItem.next();
                        tabCurrentItem.removeClass('active');
                        if (nextItem.length) {
                            tabCurrentItem = nextItem.addClass('active');
                        } else {
                            tabCurrentItem = tabItems.first().addClass('active');
                        }
                        changePos();
                        changeTab();
                    });
                    thisTab.find('.tab-prev').on('click', function(e) {
                        e.preventDefault();
                        var prevItem = tabCurrentItem.prev();
                        tabCurrentItem.removeClass('active');
                        if (prevItem.length) {
                            tabCurrentItem = prevItem.addClass('active');
                        } else {
                            tabCurrentItem = tabItems.last().addClass('active');
                        }
                        changePos();
                        changeTab();
                    });
                });
            }
        });


        
		//업로드버튼
        var uploadButton = {
            $button: $('.uploadButton-input'),
            $nameField: $('.uploadButton-file-name')
        };
        uploadButton.$button.on('change', function() {
            _populateFileField($(this));
        });

        function _populateFileField($button) {
            var selectedFile = [];
            for (var i = 0; i < $button.get(0).files.length; ++i) {
                selectedFile.push($button.get(0).files[i].name + '<br>');
            }
            uploadButton.$nameField.html(selectedFile);
        }

    });
})(this.jQuery);