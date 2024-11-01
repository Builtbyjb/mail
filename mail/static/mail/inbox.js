document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

    // Sends emails
    document.querySelector("#compose-form").onsubmit = (event) => {
        event.preventDefault();
        let recipients = document.querySelector("#compose-recipients").value;
        let subject = document.querySelector("#compose-subject").value;
        let body = document.querySelector("#compose-body").value;

        submit(recipients, subject, body);
    };
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    toggle_active("compose");

}

async function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    toggle_active(mailbox);

    await fetch(`/emails/${mailbox}`, {
        method: "GET",
    })
        .then(res => res.json())
        .then(mails => {
            mails.forEach(mail => {
                mailbox === "sent" ? addr = mail.recipients[0] : addr = mail.sender;
                mail.read ? bg = "bg-grey" : bg = "bg-white";
                const div = document.createElement("div");;
                div.classList.add("email", `${bg}`, "d-flex", "justify-content-between", "py-1", "px-3", "border", "border-dark", "mb-2");
                div.innerHTML = `
                    <div class="d-flex">
                        <p class="addr">${addr}</p>
                        <p>${mail.subject}</p>
                    </div>
                    <p>${mail.timestamp}</p>`;

                div.addEventListener("click", () => view_email(mail, mailbox));
                document.querySelector("#emails-view").append(div);
            })
        })
        .catch(err => console.log(err))
}

async function view_email(mail, mailbox) {
    // Displays an email
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    document.querySelector('#email-sender').innerHTML = `<strong>From:</strong> ${mail.sender}`;
    document.querySelector('#email-recipient').innerHTML = `<strong>To:</strong> ${mail.recipients[0]}`;
    document.querySelector('#email-subject').innerHTML = `<strong>Subject:</strong> ${mail.subject}`;
    document.querySelector('#email-timestamp').innerHTML = `<strong>Timestamp:</strong> ${mail.timestamp}`;
    document.querySelector('#email-body').innerHTML = mail.body;

    // Only displays Archive, Unarchive and reply button in the inbox mailbox
    if (mailbox !== "sent") {
        document.querySelector("#email-archive").style.display = "block";
        document.querySelector("#email-reply").style.display = "block";

        if (mail.archived === false) {
            document.querySelector("#email-archive").innerHTML = "Archive";
        } else {
            document.querySelector("#email-archive").innerHTML = "Unarchive";
        }
    } else {
        document.querySelector("#email-archive").style.display = "none";
        document.querySelector("#email-reply").style.display = "none";
    }

    await fetch(`/emails/${mail.id}`, {
        method: "PUT",
        body: JSON.stringify({
            read: true,
        }),
    })
        .catch(err => console.log(err));

    document.querySelector("#email-archive").onclick = () => archive_email(mail);
    document.querySelector("#email-reply").onclick = () => reply_email(mail);
}

function reply_email(mail) {
    compose_email();
    document.querySelector("#compose-recipients").value = mail.sender;
    document.querySelector("#compose-subject").value = mail.subject.startsWith("Re:")
        ? mail.subject
        : `Re: ${mail.subject}`;
    document.querySelector("#compose-body").value = `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body} `;
}

async function archive_email(mail) {
    let value = !mail.archived;

    await fetch(`/emails/${mail.id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: value
        })
    })
        .catch(err => console.log(err));

    // Loads the inbox mailbox and updates the web app state
    window.location.reload();
}

async function submit(recipients, subject, body) {
    await fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        }),

    })
        .then(res => res.json())
        .then(() => {
            load_mailbox("sent");
        })
        .catch(err => console.log(err))
}

function toggle_active(mailbox) {

    document.querySelectorAll(".current").forEach(button => {
        button.classList.remove("active");
    });

    document.querySelector(`#${mailbox}`).classList.add("active");
}
