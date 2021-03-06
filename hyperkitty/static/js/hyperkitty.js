/*
 * Copyright (C) 1998-2012 by the Free Software Foundation, Inc.
 *
 * This file is part of HyperKitty.
 *
 * HyperKitty is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * HyperKitty is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * HyperKitty.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Aurelien Bompard <abompard@fedoraproject.org>
 */


/*
 * Generic
 */
function form_to_json(form) {
    var form_data = form.serializeArray();
    var data = {};
    for (input in form_data) {
        data[form_data[input].name] = form_data[input].value;
    }
    return data;
}


/*
 * Voting
 */

function vote(elem, value) {
    if ($(elem).hasClass("disabled")) {
        return false;
    }
    var form = $(elem).parents("form").first();
    var data = form_to_json(form);
    data['vote'] = value;
    $.ajax({
        type: "POST",
        url: form.attr("action"),
        dataType: "json",
        data: data,
        success: function(response) {
            form.replaceWith(response.html);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(jqXHR.responseText);
        }
    });
    return false;
}


function setup_vote() {
    /*
    $("a.youlike").click(function(e) { e.preventDefault(); vote(this, 1); });
    $("a.youdislike").click(function(e) { e.preventDefault(); vote(this, -1); });
    */
}


/*
 * Tagging
 */

function setup_add_tag() {
    $("#add-tag-form").submit( function () {
        $.ajax({
            type: "POST",
            dataType: "json",
            data : $(this).serialize(),
            url: $(this).attr("action"),
            success: function(data) {
                $("#tags").html(data.html);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // authentication and invalid data
                alert(jqXHR.responseText);
            }
        });
        return false;
    });
}


/*
 * Favorites
 */

function setup_favorites() {
    $(".favorite input[name='action']").bind("change", function() {
        // bind the links' visibilities to the hidden input status
        var form = $(this).parents("form").first();
        if ($(this).val() === "add") {
            form.find("a.saved").hide();
            form.find("a.notsaved").show();
        } else {
            form.find("a.notsaved").hide();
            form.find("a.saved").show();
        }
    }).trigger("change");
    $(".favorite a").bind("click", function(e) {
        e.preventDefault();
        if ($(this).hasClass("disabled")) {
            return;
        }
        var form = $(this).parents("form").first();
        var action_field = form.find("input[name='action']");
        var data = form_to_json(form);
        $.ajax({
            type: "POST",
            url: form.attr("action"),
            dataType: "text",
            data: data,
            success: function(response) {
                // Update the UI
                if (action_field.val() === "add") {
                    action_field.val("rm");
                } else {
                    action_field.val("add");
                }
                action_field.trigger("change");
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 403) {
                    alert(jqXHR.responseText);
                }
            }
        });
    });
}


/*
 * Replies
 */

function setup_replies() {
    $("a.reply").click(function(e) {
        e.preventDefault();
        if (!$(this).hasClass("disabled")) {
            $(this).next().slideToggle("fast", function() {
                if ($(this).css("display") === "block") {
                    $(this).find("textarea").focus();
                }
            });
        }
    });
    $(".reply-form button[type='submit']").click(function(e) {
        e.preventDefault();
        var form = $(this).parents("form").first();
        var data = form_to_json(form);
        $.ajax({
            type: "POST",
            url: form.attr("action"),
            //dataType: "json",
            data: data,
            success: function(response) {
                form.parents(".reply-form").first().slideUp(function() {
                    form.find("textarea").val("");
                });
                $('<div class="reply-result"><div class="alert alert-success">'
                  + response + '</div></div>')
                    .appendTo(form.parents('.email-info').first())
                    .delay(2000).fadeOut('slow', function() { $(this).remove(); });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $('<div class="reply-result"><div class="alert alert-error">'
                  + '<button type="button" class="close" data-dismiss="alert">&times;</button> '
                  + jqXHR.responseText + '</div></div>')
                    .css("display", "none").insertBefore(form).slideDown();
            }
        });
    });
    $(".reply-form a.cancel").click(function(e) {
        e.preventDefault();
        $(this).parents(".reply-form").first().slideUp();
    });
    $(".reply-form a.quote").click(function(e) {
        e.preventDefault();
        var quoted = $(this).parents(".email").first()
                        .find(".email-body").clone()
                        .find(".quoted-switch").remove().end()
                        .find(".quoted-text").remove().end()
                        .text();
        var textarea = $(this).parents(".reply-form").find("textarea");
        // remove signature
        var sig_index = quoted.search(/^-- $/m);
        if (sig_index != -1) {
            quoted = quoted.substr(0, sig_index);
        }
        // add quotation marks
        quoted = $.trim(quoted).replace(/^/mg, "> ");
        // insert before any previous text
        textarea.val(quoted + "\n" + textarea.val());
        textarea.focus();
    });
}


/*
 * Recent activity graph
 */
function activity_graph(elem_id, dates, counts, baseurl) {
    function merge(dates, counts) {
        result = []
        for(i = 0; i < dates.length; i++) {
            result.push({
                "date": dates[i],
                "count": counts[i]
            })
        }
        return result;
    }
    var data = merge(dates, counts);
    var margin = {top: 20, right: 20, bottom: 100, left: 50},
        width = 540 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

    var format_in = d3.time.format("%Y-%m-%d");
    var format_out = d3.time.format("%m-%d");

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(format_out)
        .ticks(d3.time.days, 2);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5)
        .tickSubdivide(1);

    var area = d3.svg.area()
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.count); });

    var svg = d3.select(elem_id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
        d.date = format_in.parse(d.date);
        d.count = parseInt(d.count);
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.count; })]);

    svg.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .attr("y", -5)
        .attr("x", -30)
        .attr("transform", function(d) {
            return "rotate(-90)"
            });

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Messages");
}

/*
 * Misc.
 */

function setup_attachments() {
    $(".email-info .attachments a.attachments").each(function() {
        var att_list = $(this).next("ul.attachments-list");
        var pos = $(this).position();
        att_list.css("left", pos.left);
        $(this).click(function() {
            att_list.slideToggle('fast');
        });
    });
}

function setup_quotes() {
    $('div.email-body .quoted-switch a')
        .click(function(e) {
            e.preventDefault();
            $(this).parent().next(".quoted-text").slideToggle('fast');
        });
}

function setup_months_list() {
    var current = $("#months-list li.current").parent().prev();
    if (!current.length) {
        current = false; // overview or search
    } else {
        current = current.prevAll("h3").length;
    }
    $("#months-list").accordion({ collapsible: true, active: current });
}

function setup_disabled_tooltips() {
    $("a.disabled").tooltip().click(function (e) {
        e.preventDefault();
    });
}

function setup_flash_messages() {
    $('.flashmsg').delay(3000).fadeOut('slow');
}


/*
 * General
 */

$(document).ready(function() {
    setup_vote();
    setup_attachments();
    setup_add_tag();
    setup_quotes();
    setup_months_list();
    setup_favorites();
    setup_replies();
    setup_disabled_tooltips();
    setup_flash_messages();
});
