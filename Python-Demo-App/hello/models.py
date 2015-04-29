from hello import db
from flask.ext.login import LoginManager, UserMixin, login_required
from sqlalchemy import CheckConstraint

class UserProfile(db.Model):
    #defining the UserProfile table to have two columns; comment id and a json string
    is_anonymous = False
    comment_id = db.Column(db.Integer, db.Sequence('id_seq'), primary_key=True)
    doc = db.Column(db.Text, nullable=True)
    __table_args__ =(CheckConstraint('DOC IS JSON', name='ensure_json'), {})

    def __init__(self, text):
        self.doc = text

    @classmethod
    def get(cls, id):
        return UserProfile.query.filter_by(comment_id=id).first()

class User(db.Model):
    #defining the User table to have three columns; user id, username and password
    user_id = db.Column(db.Integer, db.Sequence('user_id_seq'), primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(50), nullable=False)

    def __init__(self, username, password):
        self.user_id = user_id
        self.username = username
        self.password = password
        self.is_anonymous = False

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def is_active(self):
        return True

    def get_id(self):
        return self.user_id

    @classmethod
    def get(cls, id):
        return User.query.filter_by(user_id=id).first()

    @classmethod
    def get_by_username(cls, username):
        return User.query.filter_by(username=username).first()


