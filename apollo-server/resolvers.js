const { User, College, Department, Board, BoardCategory, sequelize } = require('./models')
const { Op } = require('sequelize')
const graphqlFields = require('graphql-fields')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendConfirmMail } = require('./mailer/mailUtils')

sequelize.sync()

// Query Trigger 압축
let resolver = (model, findOne, conditions) => async (parent, args, context, info) => {
    let attributes = Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename'))
    if (findOne) {
        return await model.findOne({
            attributes: attributes,
            where: conditions
        })
    } else {
        return await model.findAll({
            attributes: attributes,
            where: conditions
        })
    }
}

module.exports = {
    Query: {
        async findDptByCollege(parent, args, context, info) {
            return await Department.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    college_cd: args.college_cd
                }
            })
        },
        async findColleges(parent, args, context, info) {
            return await College.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    exist_yn: args.exist_yn
                }
            })
        },
        async findNickName(parent, args, context, info) {
            return await User.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    nick_nm: args.nick_nm
                }
            })
        },
        async findEmail(parent, args, context, info) {
            return await User.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    email: args.email
                }
            })
        },
        async findUserID(parent, args, context, info) {
            return await User.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    user_id: args.userId
                }
            })
        },
        async findUserByToken(parent, args, context, info) {
            return await User.findOne({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: {
                    auth_token: args.token
                }
            })
        },
        async findUserByIdx(parent, args, context, info) {
            return await User.findOne({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => elem !== '__typename'),
                where: {
                    user_idx: args.user_idx,
                }
            })
        },
        async findBoardCategories(parent, args, context, info) {
            let searchOption = { depth: args.depth }
            if (args.title) searchOption.title = args.title
            if (args.parent) searchOption.parent = args.parent
            return await BoardCategory.findAll({
                attributes: Object.keys(graphqlFields(info)).filter((elem) => (elem !== '__typename')),
                where: searchOption
            })
        }
    },
    Mutation: {
        register: async (root, { email, user_id, password, user_nm, identity_num, user_type, sex_gb, college_cd, dpt_cd, nick_nm, reg_ip }) => {
            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(password, salt)
            const shasum = crypto.createHash('sha256')
            shasum.update(hashedPassword)
            const authToken = shasum.digest('hex')
            const user = await User.create({
                email,
                user_id,
                password: hashedPassword,
                user_nm,
                identity_num,
                user_type,
                admin_type: 'ORD',
                sex_gb,
                user_status: 'Y',
                policy_yn: 'Y',
                college_cd,
                dpt_cd,
                auth_email_yn: 'N',
                auth_token: authToken,
                user_profile: '',
                nick_nm,
                links: '',
                reg_ip,
                upt_ip: reg_ip,
                upt_dt: Date.now(),
                log_ip: reg_ip,
                log_dt: Date.now()
            })
            sendConfirmMail(user_nm, email, authToken)
            return user
        },
        lastLogin: async (root, { userId, ip }) => {
            const updateLastLogin = await User.update({ log_ip: ip, log_dt: Date.now() }, { where: { user_id: userId } })
            if (updateLastLogin) return true
            else return false
        },
        authorize: async (root, { user_idx }) => {
            const updateAuthorized = await User.update({ auth_email_yn: 'Y' }, { where: { user_idx: user_idx } })
            if (updateAuthorized) return true
            else return false
        },
        resetEmailToken: async (root, { email }) => {
            const salt = bcrypt.genSaltSync(10)
            const newToken = crypto.createHash('sha256').update(bcrypt.hashSync(email + Date.now(), salt)).digest('hex')
            const user = await User.update({ auth_token: newToken, auth_email_yn: 'N' }, { where: { email: email } })
            sendConfirmMail(undefined, email, newToken, true)
            if (user) return true
            else return false
        }
    }
}