from flask.ext.wtf import Form
from wtforms import TextField, validators, PasswordField, SelectMultipleField, widgets


class LoginForm(Form):
    # form used for login page
    username = TextField("username")
    password = PasswordField("password")

class genSearchForm(Form):
    # form used for general search
    searchInput = TextField("Search")

# options for the select multiple field in the search form
data = [('exploring', 'exploring'), ('nightlife', 'nightlife'), ('outdoors', 'outdoors'), ('sports', 'sports'), ('videogames', 'video games')]

class SearchForm(Form):
    # form used for search page
    Profname = TextField("Name")
    picture = TextField("Picture")
    about = TextField("About Me")
    age = TextField("Age")
    email = TextField("Email")
    phone = TextField("Phone Number")
    interests = SelectMultipleField("Interests", 
	choices = data,
        option_widget=widgets.CheckboxInput(),
        widget = widgets.ListWidget(prefix_label=True)
	)
    loc = TextField("Location")
    groupd = TextField("Group")
    empid = TextField("Employee ID")
    school = TextField("School")
    gradYear = TextField("Graduation Year")
    involv = TextField("Involvement")

