const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const { toJSON, paginate } = require('./plugins')

const userSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email')
        }
      },
    },
    encrypted_password: {
      type: String,
      trim: true,
      private: true, // used by the toJSON plugin
    },
    dob: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    contacts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Contact',
    },
    groups: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Group',
    },
    is_google_synced: {
      type: Boolean,
      default: false,
    },
    is_microsoft_synced: {
      type: Boolean,
      default: false,
    },
    is_teams_synced: {
      type: Boolean,
      default: false,
    },
    is_zoom_synced: {
      type: Boolean,
      default: false,
    },
    is_apple_synced: {
      type: Boolean,
      default: false,
    },
    is_email_notification_enabled: {
      type: Boolean,
      default: true,
    },
    breaks_duration: {
      type: Number,
      min: 0,
      default: 0,
    },
    blocked_days: {
      type: [Number],
    },
    available_timeslots: {
      type: [
        {
          start_day: Number,
          start_hours: Number,
          start_minutes: Number,
          end_day: Number,
          end_hours: Number,
          end_minutes: Number,
        },
      ],
    },
    blocked_timeslots: {
      type: [
        {
          start_day: Number,
          start_hours: Number,
          start_minutes: Number,
          end_day: Number,
          end_hours: Number,
          end_minutes: Number,
        },
      ],
    },
    blocked_timeslots_utc: {
      type: [
        {
          start_day: Number,
          start_hours: Number,
          start_minutes: Number,
          end_day: Number,
          end_hours: Number,
          end_minutes: Number,
        },
      ],
    },
    phone_number: {
      type: String,
      trim: true,
      validate(value) {
        if (!validator.isMobilePhone(value)) {
          throw new Error('Invalid phone number')
        }
      },
    },
    picture: {
      type: String,
      // validate(value) {
      //   if (!validator.isHexadecimal(value)) {
      //     throw new Error('Invalid picture string');
      //   }
      // },
    },
    calendar_sync_time: {
      type: Number,
    },
    token: {
      type: String,
      validate(value) {
        if (!validator.isJWT(value)) {
          throw new Error('Invalid token')
        }
      },
    },
    refresh_token: {
      type: String,
      validate(value) {
        if (!validator.isJWT(value)) {
          throw new Error('Invalid refresh token')
        }
      },
    },
    socket_id: {
      type: String,
      trim: true,
    },
    google_data: {
      email: {
        type: String,
      },
      id: {
        type: String,
      },
      calendarId: {
        type: String,
      },
      provider: {
        type: String,
      },
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
    },
    outlook_data: {
      email: {
        type: String,
      },
      id: {
        type: String,
      },
      calendarId: {
        type: String,
      },
      provider: {
        type: String,
      },
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
      code: {
        type: String,
      },
    },
    teams_data: {
      email: {
        type: String,
      },
      id: {
        type: String,
      },
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
      code: {
        type: String,
      },
    },
    apple_data: {
      email: {
        type: String,
      },
      id: {
        type: String,
      },
      calendarId: {
        type: String,
      },
      provider: {
        type: String,
      },
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
    },
    zoom_data: {
      id: {
        type: String,
      },
      email: {
        type: String,
      },
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
    },
    is_stripe_attached: {
      type: Boolean,
      default: false,
    },
    stripe_data: {
      account_id: String
    },

    last_synced: {
      type: Number,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
)

// add plugin that converts mongoose to json
userSchema.plugin(toJSON)
userSchema.plugin(paginate)

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } })
  return !!user
}

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this
  return bcrypt.compare(password, user.password)
}

userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next()
})

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema)

module.exports = User

/*

  validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },

*/
